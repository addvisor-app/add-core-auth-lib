const xsenv = require('@sap/xsenv');
const fetch = require('node-fetch');

const AuthAbstract = require('./auth-abstract.js')

module.exports = class AuthSAPCloudFoundry extends AuthAbstract{

    constructor(options){
        super(options);
        this._xsauu = xsenv.getServices({uaa:{tag: "xsuaa"}}).uaa;
        this._conn_service = xsenv.getServices({ conn: { tag: 'connectivity' } }).conn;
    }

    async isValidToken (token) {
        let valid = false;

       this._log('AuthSAPCloudFoundry isValidToken token:', token);
        if(token){
            let expDate = new Date(token.exp * 1000);
            this._log('AuthSAPCloudFoundry isValidToken token dates', expDate, new Date().getTime());
            this._log('AuthSAPCloudFoundry isValidToken token client_id', token.client_id);
            //if(token.client_id === this._clientId && expDate.getTime() >= Date.now()){
            //Duvida? Se eu comparar CLientID, como fica se um microservice se autenticou e acessou app comp de outro?    
            if(expDate.getTime() >= new Date().getTime()){
                valid = true;
            }
        }
       this._log('AuthSAPCloudFoundry isValidToken valid:', valid);
        return valid;
    }

    async logon(redirect, res){
        let xsauu = xsenv.getServices({uaa:{tag: "xsuaa"}}).uaa;
        let urlAuthorize = xsauu.url+'/oauth/authorize?response_type=code&client_secret='+xsauu.clientsecret+'&client_id='+xsauu.clientid+'&redirect_uri='+redirect;
        //console.log('AuthSAPCloudFoundry logon -> url:', urlAuthorize);
        res.redirect(urlAuthorize);
    }

    async extractToken(redirect, code){
        let uri = redirect.split("?")[0];
        //console.log('Security getToken redirect_uri', uri);
        var form = {
            'client_id': this._xsauu.clientid,
            'grant_type': 'authorization_code',
            'response_type': 'token',
            'code': code,
            'redirect_uri': uri
       };
       //console.log('Security getToken form', form);
       
       var formData = [];
       for (var property in form) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(form[property]);
            formData.push(encodedKey + "=" + encodedValue);
        }
    
        let basicAuth = this._xsauu.clientid+':'+this._xsauu.clientsecret
        let basicAuth64 = 'Basic '+Buffer.from(basicAuth).toString('base64')
       this._log('AuthSAPCloudFoundry extractToken basic base64', basicAuth64);
    
        let urlToken = this._xsauu.url+'/oauth/token';
       this._log('AuthSAPCloudFoundry extractToken urlToken', urlToken);
    
        return new Promise((resolve, reject) => {
            fetch(urlToken, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': basicAuth64,
                },
                body: formData.join("&")
            }).then(response => {
               this._log('AuthSAPCloudFoundry extractToken response ok', response.ok, response.status, response.statusText);
                if(response.ok){
                    return response.json();
                }else{
                    reject('AuthSAPCloudFoundry extractToken not ok '+ response.status+ ' '+response.statusText);
                }
            }).then(data => {
                //console.log('AuthSAPCloudFoundry extractToken response data', data);
                resolve(data);
            }).catch(err =>{
               this._log('AuthSAPCloudFoundry extractToken err', err);
                reject(err);
            });
        });
    }
}