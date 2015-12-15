/**
 * Created by amills001c on 12/11/15.
 */


var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var helpers = require('./helpers');

function handleRequest(req, res) {

    var requestUrl = url.parse(req.url);

    console.log('requestUrl:', requestUrl);

    req.sumanData = sumanData = {};

    var fsPath;
    if (new RegExp(/^\/$/).test(requestUrl.pathname)) {   // === '/'
        sumanData.fsPath = path.resolve(appRootPath + '/view/index.html');
        helpers.retrieveResults(req,res);
    }
    else if(requestUrl.pathname === '/favicon.ico'){
        sumanData.fsPath = path.resolve(appRootPath + '/view/favicon.ico');
        helpers.retrieveResults(req,res);
    }
    else if(new RegExp(/^\/results\//).test(requestUrl.pathname)){ // === '/results'
        sumanData.fsPath = path.resolve(appRootPath + requestUrl.pathname + '/temp.html');
        helpers.retrieveResults(req,res);
    }
    else{
        sumanData.fsPath = path.resolve(appRootPath  + '/view/404.html');
        helpers.retrieveResults(req,res);
    }

}


function end(req, res) {
    res.end(); // inside finally so errors don't make browsers hang
}


module.exports = handleRequest;