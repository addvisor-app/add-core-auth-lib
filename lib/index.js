'use strict';
const url = require('url');

const AuthSAPCloudFoundry = require("./resources/auth-scp-foundry.js");
const AuthIdentityAdd = require("./resources/auth-identity-add.js");

let authClient = null;
let authProtected = false;
let uriProtectedExclude = [];
let client = null;
let opt = null;

exports.factory = (options) => {
    
    options = (options) ? options : {}
    client = (options.client) ? options.client : null;
    authProtected = (options.protected != undefined) ? options.protected : authProtected;
    uriProtectedExclude = (options.exclude != undefined) ? options.exclude : uriProtectedExclude;
    opt = options;
    
    //return middleware;
    return {
        authenticate: function() {
            return authenticate;
        },

        signIn: function() {
            return signIn;
        }
    }
}

var instanceClient = async (options) => {
    //Check Identity Provider Client in Global Variable for Add Core Flow 
    if(!client){
        const api = require("axios").create();
        const url = process.env.ADD_GLOBAL_VARIABLE_URL +"/ADD_IDENTITY_CLIENT";
        const response = await api.get(url, {headers:{accept : "application/json"}})

        if(response && response.data){
            client = response.data.value;
        }
    }
    console.log("LIB AUTH FACTORY client", client);
    
    switch (client) {
        case 'sap_cf':
            authClient = new AuthSAPCloudFoundry(options);
            break;
        default:
            authClient = new AuthIdentityAdd(options);
    }
}

var authenticate = async (req, res, next) => {
    console.log('Auth middleware authenticate -> url', req.url);
    if(!authClient){
        await instanceClient(opt);
    }

    const exclude = uriProtectedExclude.filter((uri) => {return req.url.startsWith(uri)});
    
    const token = await authClient.getToken(req);
    const valid = await authClient.isValidToken(token);
   
    console.log('Auth middleware authenticate -> valid:', valid);
    console.log('Auth middleware authenticate -> authProtected:', authProtected);
    

    //if(!req.headers.isAuthenticated && authProtected && exclude.length <= 0){
    if(!valid && authProtected && exclude.length <= 0){
        res.status(401).send({status: 401, statusText: 'Unauthorized'})
    }else{
        req.headers.isAuthenticated = valid;
        req.headers.token = token;

        console.log('Auth middlewarevalid -> isAuthenticated:', valid);
        next();
    } 
}

var signIn = async (req, res, next) => {
    console.log('Auth middleware signIn -> url', req.url);
    if(!authClient){
        await instanceClient(opt);
    }

    if(authClient._ignoreAuthByUri(req.originalUrl)){
        next();
    
    }else{
        const token = await authClient.getToken(req);
        const authorized = await authClient.isValidToken(token);
        //console.log('Auth middleware signIn -> authorized', authorized);
    
        if(authorized){
            next();
    
        }else{
            let query = url.parse(req.url, true).query;
            let code = query.code;
            let redirect = authClient._getRedirectURL(req);
            
            if(!code){
                authClient.logon(redirect, res);
    
            }else{
                const jwt = await authClient.extractToken(redirect, code)
                                            .catch(err =>{
                                                console.log('Auth middleware signIn -> extractToken err',err);
                                                res.status(400).send({'message':err});
                                                return;
                                            });
                
                let expireTime = 1;
                if(jwt.expires_in){
                    expireTime = jwt.expires_in * 1000;
                }else if (jwt.expires){
                    expireTime = jwt.expires * 1000;
                }
                console.log("JWT", jwt);
                console.log("JWT expireTime", expireTime);

                res.cookie('x-access-token', jwt.access_token  , { maxAge: expireTime, httpOnly: true });
                res.status(200).send(authClient._getRedirectPageTemplate(redirect));
            }
        }
    }
   //console.log('middleware2 auth url', req.url);
   //console.log('middleware2 auth req', req.headers);
   //next();
}