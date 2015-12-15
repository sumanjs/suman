/**
 * Created by denman on 12/14/2015.
 */


var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var helpers = require('../helpers');
var du = require('du');
var config = require('../../sumanConfig');

module.exports = function(req,res){

    var helpers = require('../helpers');

    var fsPath = req.sumanData.fsPath;

    console.log('fsPath:', fsPath);

    du(path.resolve(appRootPath + '/results/'), function (err, size) { //get size of results dir
        console.log('The size of /results/ is:', size, 'bytes');

        size = size/1000;

        if(config.resultsCapSize && config.resultsCapSize <= size){

        }
        else{
            helpers.serveFile(req,res);
        }


    });




};