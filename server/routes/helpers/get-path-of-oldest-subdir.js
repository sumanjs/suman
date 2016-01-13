/**
 * Created by amills001c on 12/15/15.
 */




var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');
var _ = require('underscore');

module.exports = function (dir) {

    try {

        dir = path.resolve(appRootPath + '/' + dir);

        return _.sortBy(fs.readdirSync(dir), function (subdir) { //note: return the first element of array after sorting
            return parseInt(subdir);
        })[0];
    }
    catch (err) {
        return null;
    }

};