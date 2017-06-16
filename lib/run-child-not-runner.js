'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var util = require('util');
var colors = require('colors/safe');
var sumanUtils = require('suman-utils');
var debug = require('suman-debug')('s');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants').constants;
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var USE_BABEL_REGISTER = process.env.USE_BABEL_REGISTER === 'yes';
process.on('uncaughtException', function (err) {
    if (typeof err !== 'object') {
        var val = typeof err === 'string' ? err : util.inspect(err);
        console.error(' => Warning, value passed to uncaughtException handler was not typeof "object" => ', val);
        err = { message: val, stack: val };
    }
    setTimeout(function () {
        if (err && !err._alreadyHandledBySuman) {
            console.error('\n', ' => Suman uncaught exception =>', '\n', (err.stack || err), '\n\n');
        }
        process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    }, 500);
});
var root = _suman.projectRoot || sumanUtils.findProjectRoot(process.cwd());
var sumanHelperDirRoot = _suman.sumanHelperDirRoot;
var sumanConfig = _suman.sumanConfig;
try {
    require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));
}
catch (err) {
    console.error('\n', colors.yellow.bold(' => Suman usage warning => Could not load your suman.globals.js file.'));
    console.error(err.stack || err);
    console.error(' => Suman will continue optimistically, even though your suman.globals.js file could not be loaded.');
}
module.exports = function run(files) {
    if (USE_BABEL_REGISTER) {
        console.log(colors.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly, ' +
            'use the -v option for more info.'), '\n\n');
        require('babel-register')({
            ignore: /node_modules/
        });
    }
    if (SUMAN_SINGLE_PROCESS) {
        console.log(' => Suman debug message => we are in SUMAN_SINGLE_PROCESS mode.');
        require('./helpers/log-stdio-of-child')('suman-single-process');
        require('./handle-single-proc')(files);
    }
    else {
        require('./helpers/log-stdio-of-child')(files[0]);
        require(files[0]);
    }
};
