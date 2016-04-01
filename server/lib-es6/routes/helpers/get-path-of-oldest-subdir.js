/**
 * Created by denman on 12/15/15.
 */


var url = require('url');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

module.exports = function (dir) {

    try {

        console.log('dir:', dir);

        dir = path.resolve(dir);

        return _.sortBy(fs.readdirSync(dir), function (subdir) { //note: return the first element of array after sorting
            return parseInt(subdir);
        })[0];
    }
    catch (err) {
        return null;
    }

};