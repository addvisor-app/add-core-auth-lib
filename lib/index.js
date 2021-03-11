'use strict';
const url = require('url');

const AuthAbstract = require("./resources/AuthAbstract");
const AuthSAPCloudFoundry = require("./resources/AuthSAPCloudFoundry.js");

let authClient = null;
let authProtected = false;
let uriProtectedExclude = [];

exports.factory = (ideProvier, options) => {
   
    if(options){
        authProtected = (options.protected != undefined) ? options.protected : authProtected;
        uriProtectedExclude = (options.exclude != undefined) ? options.exclude : uriProtectedExclude;
    }
    
    switch (ideProvier) {
        case 'sap_cf':
            authClient = new AuthSAPCloudFoundry(options);
            break;
        default:
            authClient = new AuthAbstract(options);
    }

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

var authenticate = async (req, res, next) => {
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
                                            })
                let expireTime = data.expires_in * 1000;
                res.cookie('JWT', data.access_token  , { maxAge: expireTime, httpOnly: true });
                res.status(200).send(authClient._getRedirectPageTemplate(redirect));
            }
        }
    }
   //console.log('middleware2 auth url', req.url);
   //console.log('middleware2 auth req', req.headers);
   //next();
}