/**
 * Created by amills001c on 12/15/15.
 */



var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var _ = require('underscore');

module.exports = function (dir) {

    dir = path.resolve(dir);

    console.log('diiir:',dir);

    var filtered = fs.readdirSync(dir).filter(function(subdir){
        return (!fs.statSync(path.resolve(dir + '/' + subdir)).isFile() && typeof Number(subdir) === 'number' && !isNaN(Number(subdir)));
    });

    try{
        return _.sortBy(filtered,function(subdir){  //return the first element of array after sorting
            console.log('subdir:',subdir);
            return -1 * parseInt(subdir);
        })[0];
    }
    catch(err){
        return null;
    }


};