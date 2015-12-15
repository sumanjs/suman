/**
 * Created by amills001c on 12/11/15.
 */


var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var helpers = require('./helpers');
var _ = require('underscore');

function handleRequest(req, res) {

    res.on('end',_.once(onEnd));
    res.on('close',_.once(onEnd));

    var requestUrl = req.parsedRequestUrl = url.parse(req.url);

    console.log('requestUrl:', requestUrl);

    req.sumanData = sumanData = {};

    var fsPath;
    if (new RegExp(/^\/$/).test(requestUrl.pathname)) {   // === '/'
        sumanData.fsPath = path.resolve(appRootPath + '/view/index.html');
        helpers.serveFile(req, res);
    }
    else if (requestUrl.pathname === '/favicon.ico') {
        sumanData.fsPath = path.resolve(appRootPath + '/view/favicon.ico');
        helpers.serveFavicon(req, res);
    }
    else if (new RegExp(/^\/results\//).test(requestUrl.pathname)) { // startswith '/results/'
        //sumanData.fsPath = path.resolve(appRootPath + requestUrl.pathname + '/temp.html');
        helpers.retrieveResults(req, res);
    }
    else {
        sumanData.fsPath = path.resolve(appRootPath + '/view/404.html');
        helpers.serveFile(req, res);
    }

}


function onEnd(msg){

    console.log('res has emitted end event, message:',msg);
    var error = new Error('Not real error');
    console.log(error.stack);
}

function end(req, res) {
    res.end(); // inside finally so errors don't make browsers hang
}


module.exports = handleRequest;