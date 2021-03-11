'use strict';

module.exports = class AuthAbstract {

    constructor(options){
        console.log("AuthAbstract options",options);
        
        this._clientId = options.clientId;
        this._clientSecret = options.clientSecret;
        this._authType = options.authType;
    }

    async getToken(req){
        let token = null;
        
        token = this._getAuthorizationToken(req);
        if(!token){
            token = this._getCookieToken(req);
        }

        return token;
    }

    async isValidToken(token){
        console.log('AuthAbstract isValidToken not implemented', req.url);
        return false;
    }

    async logon(redirect, res){
        console.log('AuthAbstract logon not implemented', req.url);
    }

    async extractToken(redirect, code){
        console.log('AuthAbstract extractToken not implemented', req.url);
    }

    async authorize (req, res, next) {
        console.log('AuthAbstract authorize not implemented:', req.url);
        return false;
    }

    _getAuthorizationToken(req){
        let token = null;

        const authorization = req.headers.authorization;
        console.log('AuthAbstract _getAuthorizationToken authorization', authorization);               
        if(authorization){
            if(authorization.includes('Bearer')){
                const jwt = authorization.split('Bearer ')[1];
                //token = this._getJWTData(jwt);
                token = jwt;
                
                //console.log('AuthAbstract _getAuthorizationToken token data', token.user_name, token.exp);               
            }
        }
        console.log('AuthAbstract _getAuthorizationToken token', token); 
        return token;
    }

    _getCookieToken(req){
        let token = null;

        let cookies = req.headers.cookie;
        console.log('AuthAbstract _getCookieToken cookies', cookies)
        if(cookies){
            const rawCookies = req.headers.cookie.split('; ');
            rawCookies.forEach(rawCookie=>{
                const parsedCookie = rawCookie.split('=');
                //console.log('AuthAbstract _getCookieToken cookie name', parsedCookie[0])
                //console.log('AuthAbstract _getCookieToken cookie content', parsedCookie[1])
                if(parsedCookie[0] === 'x-access-token'){
                    //token = this._getJWTData(parsedCookie[1])    
                    token = parsedCookie[1];   
                }
            });
        }
        return token;
    }

    _getJWTData(token){
        this._token = token;
        const tokenParts = this._token.split(".");
        const tokenString  = Buffer.from(tokenParts[1], 'base64').toString('ascii');
        return JSON.parse(tokenString);
    }

    _getRedirectURL(req){
        const protocol = (req.headers['x-forwarded-proto']) ? req.headers['x-forwarded-proto'] : "https";
        const host =  (req.hostname) ? req.hostname : req.host;
        let uri = req.originalUrl;
        let query = req.query
        
        uri = uri.includes('?code=') ? uri.split('?code=')[0] : uri;
        const url = protocol + "://" + host + uri;
        //url = (query) ? url + "?" + queryString.stringify(query) : url
        //console.log('Security OAuthClient REDIRECT url', url);
        return url;
    }

    _getRedirectPageTemplate(redirect){
        return `<!DOCTYPE html>
                <html dir="ltr" lang="en">
                    <head>
                        <title>Addtax Cloud Platform</title>
                        <meta charset='utf-8' />
                        <meta name='author' content="Addvisor"/>
                        <meta name='copyright' content="Copyright © 2020 Addvisor. All rights reserved." />
                        
                        <script>
                            function samlRedirect(link) {
                                if (link != null && link.length > 0){
                                    location.href = link;
                                }
                            }
                            samlRedirect('${redirect}');
                        </script>
                    </head>
                    <body>
                            <p>wait your browser redirects to target page...<p> 
                    </body>
                </html>`;
    }

    _ignoreAuthByUri(uri){
        let ignore = false;

        if(uri.includes('manifest.json')){
            ignore = true;
        }
        if(uri.endsWith('.js')){
            ignore = true;
        }
        if(uri.endsWith('.xml')){
            ignore = true;
        }
        if(uri.endsWith('.properties')){
            ignore = true;
        }
        if(uri.endsWith('.css')){
            ignore = true;
        }
        if(uri.endsWith('.jpg') || uri.endsWith('.jpge') || uri.endsWith('.gif')){
            ignore = true;
        }
        return ignore;
    }
}