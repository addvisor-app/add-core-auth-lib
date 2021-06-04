const xsenv = require('@sap/xsenv');
const fetch = require('node-fetch');

const AuthAbstract = require('./auth-abstract.js')

module.exports = class AuthIdentityAdd extends AuthAbstract{

    constructor(options){
        super(options);
        
        this._clientId = (options.clientId) ? options.clientId : null;
        this._clientSecret = (options.clientSecret) ? options.clientSecret : null;
        this._grantType = (options.grantType) ? options._grantType : null;

        this._ideApi = await connectApi.factory({'destination' : 'add-core-identity-app'});

        if(this._clientId == null || this._clientSecret == null){
            
            const app = options.application;
            const response = await this._ideApi.destination().get('/add/identity/clients?appname='+app);
            
            if(response && response.data){
                this._clientId =  response.data.client_id;
                this._clientSecret =  response.data.client_secret;
                this._grantType = response.data.grant_type;
            }
        }
              
        //this._xsauu = xsenv.getServices({uaa:{tag: "xsuaa"}}).uaa;
        //this._conn_service = xsenv.getServices({ conn: { tag: 'connectivity' } }).conn;
    }

    async isValidToken (token) {
        let valid = false;

        console.log('AuthIdentityAdd isValidToken token:', token);
        if(token){
            let expDate = new Date(token.exp * 1000);
            console.log('AuthIdentityAdd isValidToken token dates', expDate, Date.now());
            console.log('AuthIdentityAdd isValidToken token client_id', token.client_id);
            if(token.client_id === this._clientId && expDate >= Date.now()){
                valid = true;
            }
        }
        console.log('AuthIdentityAdd isValidToken valid:', valid);
        return valid;
    }

    async logon(redirect, res){
        const host = await this._ideApi._getHost();
        let urlAuthorize = host+'/add/identity/oauth/authorize?response_type=code&client_secret='+this._clientSecret+'&client_id='+this._clientId+'&redirect_uri='+redirect;
        console.log('AuthIdentityAdd logon -> url:', urlAuthorize);
        res.redirect(urlAuthorize);
    }

    async extractToken(redirect, code){
        let uri = redirect.split("?")[0];
        console.log('AuthIdentityAdd extractToken redirect_uri', uri);
        var form = {
            'client_id': this._clientId,
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
    
        let basicAuth = this._clientId + ':' + this._clientSecret
        let basicAuth64 = 'Basic '+Buffer.from(basicAuth).toString('base64')
        console.log('AuthIdentityAdd extractToken basic base64', basicAuth64);
    
        const host = await this._ideApi._getHost();    
        let urlToken = host + '/add/identity/oauth/token';
        console.log('AuthIdentityAdd extractToken urlToken', urlToken);
    
        return new Promise((resolve, reject) => {
            fetch(urlToken, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': basicAuth64,
                },
                body: formData.join("&")
            }).then(response => {
                console.log('AuthIdentityAdd extractToken response ok', response.ok, response.status, response.statusText);
                if(response.ok){
                    return response.json();
                }else{
                    reject('AuthIdentityAdd extractToken not ok '+ response.status+ ' '+response.statusText);
                }
            }).then(data => {
                //console.log('AuthIdentityAdd extractToken response data', data);
                resolve(data);
            }).catch(err =>{
                console.log('AuthIdentityAdd extractToken err', err);
                reject(err);
            });
        });
    }
}