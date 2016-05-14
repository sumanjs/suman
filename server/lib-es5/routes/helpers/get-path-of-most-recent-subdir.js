'use strict';

/**
 * Created by denman on 12/15/15.
 */

var url = require('url');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

module.exports = function (dir) {

    //TODO: these functions should be async...

    try {

        console.log('dir:', dir);

        var filtered = fs.readdirSync(dir).filter(function (subdir) {
            return !fs.statSync(path.resolve(dir + '/' + subdir)).isFile() && typeof Number(subdir) === 'number' && !isNaN(Number(subdir));
        });

        return _.sortBy(filtered, function (subdir) {
            //note: return the first element of array after sorting
            return -1 * parseInt(subdir);
        })[0];
    } catch (err) {
        return null;
    }
};