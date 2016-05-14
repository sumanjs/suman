'use strict';

/**
 * Created by denman on 12/15/15.
 */

var url = require('url');
var fs = require('fs');
var path = require('path');

module.exports = function (req, res) {

    var helpers = require('index');

    var error = req.sumanData.error || new Error('unknown Suman error');
    res.write(error);
    res.end();
};