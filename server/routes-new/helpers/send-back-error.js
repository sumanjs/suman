/**
 * Created by denman on 12/15/15.
 */


var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');

module.exports = function (req, res) {

    var helpers = require('../helpers');

    var error = req.sumanData.error || new Error('unknown Suman error');
    res.write(error);
    res.end();
};