/**
 * Created by denman on 12/11/15.
 */

//core
var express = require('express');
var router = express.Router();
var path = require('path');

//config
var config = require('adore')(module,'*suman*', 'server/config/conf');


var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var helpers = require('./helpers');
var _ = require('underscore');

function handleRequest(req, res) {

    var fsPath;
    if (new RegExp(/^\/$/).test(requestUrl.pathname)) {   // === '/'
        sumanData.fsPath = path.resolve(appRootPath + '/views/index.html');
        helpers.serveFile(req, res);
    }
    else if (requestUrl.pathname === '/favicon.ico') {
        sumanData.fsPath = path.resolve(appRootPath + '/views/favicon.ico');
        helpers.serveFavicon(req, res);
    }
    else if (new RegExp(/^\/results\//).test(requestUrl.pathname)) { // startswith '/results/'
        //sumanData.fsPath = path.resolve(appRootPath + requestUrl.pathname + '/temp.html');
        helpers.retrieveResults(req, res);
    }
    else {
        sumanData.fsPath = path.resolve(appRootPath + '/views/404.html');
        helpers.serveFile(req, res);
    }

}



module.exports = router;