const addAxios = await require("add-core-catalog-lib").consume();

//const addAxios = await consume();
const fetch = require('node-fetch');

const AuthAbstract = require('./auth-abstract.js')

module.exports = class AuthIdentityAdd extends AuthAbstract {

    constructor(options) {
        super(options);

        var pjson = require('../../../../package.json');
        this._app = pjson.name;
        this._ideApi = null;
    }

    async isValidToken(token) {
        let valid = false;

        //this._log('AuthIdentityAdd isValidToken token:', token);
        if (token) {
            let expDate = new Date(token.exp * 1000);
            this._log('AuthIdentityAdd isValidToken token ext', expDate);
            this._log('AuthIdentityAdd isValidToken token ext:', expDate.getTime(), "now:", new Date().getTime());
            this._log('AuthIdentityAdd isValidToken token client_id', token.client_id);
            //if(token.client_id === this._clientId && expDate.getTime() >= Date.now()){
            //Duvida? Se eu comparar CLientID, como fica se um microservice se autenticou e acessou app comp de outro?    
            if (expDate.getTime() >= new Date().getTime()) {
                valid = true;
            }

            //TO-DO - Implementar a Autenticidade da assinatura do JWT no Identity Provider.

        }
        this._log('AuthIdentityAdd isValidToken valid:', valid);
        return valid;
    }

    async logon(redirect, res) {

        if (!this._ideApi) {
            await this._getClient();
        }

        const host = await this._ideApi._getHost();
        let url = host + '/add/identity';
        if (this._clientId && this._clientSecret) {
            url = url + '/oauth/authorize?response_type=code&client_secret=' + this._clientSecret + '&client_id=' + this._clientId + '&redirect_uri=' + redirect;
        } else {
            url = url + '/ui/signin/wrong.html?app=' + this._app;
        }

        this._log('AuthIdentityAdd logon -> url:', url);
        res.redirect(url);
    }

    async extractToken(redirect, code) {
        if (!this._ideApi) {
            await this._getClient();
        }

        let uri = redirect.split("?")[0];
        this._log('AuthIdentityAdd extractToken redirect_uri', uri);
        var form = {
            'client_id': this._clientId,
            'grant_type': 'authorization_code',
            'response_type': 'token',
            'code': code,
            'redirect_uri': uri
        };
        //this._log('Security getToken form', form);

        var formData = [];
        for (var property in form) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(form[property]);
            formData.push(encodedKey + "=" + encodedValue);
        }

        let basicAuth = this._clientId + ':' + this._clientSecret
        let basicAuth64 = 'Basic ' + Buffer.from(basicAuth).toString('base64')
        this._log('AuthIdentityAdd extractToken basic base64', basicAuth64);

        const host = await this._ideApi._getHost();
        let urlToken = host + '/add/identity/oauth/token';
        this._log('AuthIdentityAdd extractToken urlToken', urlToken);

        return new Promise((resolve, reject) => {
            fetch(urlToken, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': basicAuth64,
                },
                body: formData.join("&")
            }).then(response => {
                this._log('AuthIdentityAdd extractToken response ok', response.ok, response.status, response.statusText);
                if (response.ok) {
                    return response.json();
                } else {
                    reject('AuthIdentityAdd extractToken not ok ' + response.status + ' ' + response.statusText);
                }
            }).then(data => {
                //this._log('AuthIdentityAdd extractToken response data', data);
                resolve(data);
            }).catch(err => {
                this._log('AuthIdentityAdd extractToken err', err);
                reject(err);
            });
        });
    }

    async _getClient() {
        this._ideApi = await addAxios.factory({ 'destination': 'add-core-identity-app' });

        if (this._clientId == null || this._clientSecret == null) {
            this._log("AuthIdentityAdd _getClient app:", this._app);


            const response = await this._ideApi.get('/add/identity/clients?appname=' + this._app);

            if (response && response.data) {
                this._clientId = response.data.client_id;
                this._clientSecret = response.data.client_secret;
                this._grantType = response.data.grant_type;
            }
        }
        this._log("AuthIdentityAdd _getClient clientId:", this._clientId);
    }
}