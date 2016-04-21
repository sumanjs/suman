/**
 * Created by denman on 12/14/2015.
 */


var url = require('url');
var fs = require('fs');
var path = require('path');
var helpers = require('./index');
var du = require('du');
var config = require('../../../../suman.conf.js');


module.exports = function (req, res) {

    var helpers = require('index');

    var urlTemp = String(req.parsedRequestUrl.pathname);

    console.log('urlTemp:', urlTemp);

    var index = urlTemp.indexOf('/results/');

    console.log('index:', index);

    var resultsPath = urlTemp.substr(index + String('/results/').length);

    //var resultsPath = urlTemp.match('/results/');
    //
    console.log('results path:', resultsPath);

    var mainDir = path.resolve(appRootPath + '/results/');  //TODO: appRootPath removed

    du(mainDir, function (err, size) { //get size of results dir
        console.log('The size of /results/ is:', size, 'bytes');

        size = size / 1000;

        if (config.resultsCapSize && config.resultsCapSize <= size) {

            var deleteThisDir = helpers.getPathOfOldestSubdir(mainDir);
            if (deleteThisDir) {
                fs.unlinkSync(deleteThisDir);
            }
        }

        var fsPath;
        if (resultsPath === 'latest') {

            var serveThisDir = helpers.getPathOfMostRecentSubdir(mainDir);
            if (serveThisDir) {
                fsPath = req.sumanData.fsPath = path.resolve(appRootPath + '/' + 'results' + '/' + serveThisDir + '/' + 'temp.html');
                if (fsPath) {
                    helpers.serveFile(req, res);
                }
                else {
                    req.sumanData.error = new Error('no result set');
                    helpers.sendBackError(req, res);
                }
            }
            else {
                helpers.sendBackError(req, res);
            }
        }
        else if (typeof Number(resultsPath) === 'number' && !isNaN(Number(resultsPath))) {

            fsPath = req.sumanData.fsPath = path.resolve(appRootPath + '/' + 'results' + '/' + resultsPath + '/' + 'temp.html');
            if (fsPath) {
                helpers.serveFile(req, res);
            }
            else {
                req.sumanData.error = new Error('no result set');
                helpers.sendBackError(req, res);
            }

        }
        else {

            helpers.serveFile(req, res);
        }


    });


};