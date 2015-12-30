/**
 * Created by amills001c on 12/15/15.
 */




var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var _ = require('underscore');

module.exports = function (dir) {

    dir = path.resolve(appRootPath + '/' + dir);

    try{
        return _.sortBy(fs.readdirSync(dir),function(subdir){
            console.log('subdir:',subdir);
            return parseInt(subdir);
        })[0];
    }
    catch(err){
        return null;
    }

};