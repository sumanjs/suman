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
process.on('uncaughtException', function (err) {
    if (typeof err !== 'object') {
        var val = typeof err === 'string' ? err : util.inspect(err);
        console.error(' => Warning, value passed to uncaughtException handler was not typeof "object" => ', val);
        err = { stack: val };
    }
    process.nextTick(function () {
        if (err && !err._alreadyHandledBySuman) {
            console.error('\n', ' => Suman uncaught exception =>', '\n', (err.stack || err), '\n\n');
        }
        process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    });
});
var root = _suman.projectRoot || sumanUtils.findProjectRoot(process.cwd());
var sumanConfig = _suman.sumanConfig;
var sumanHelperDirRoot = _suman.sumanHelperDirRoot;
if (!sumanHelperDirRoot) {
    console.log(colors.red.bold(' => Suman helper root is falsy in run-child-not-runner.'));
}
else {
    debug(' => Suman helper root dir in run-child-not-runner =>', sumanHelperDirRoot);
}
try {
    require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));
}
catch (err) {
    console.error('\n\n', colors.yellow.bold(' => Suman usage warning => Could not load your suman.globals.js file =>') +
        '\n' + (_suman.sumanOpts.verbose ? (err.stack || err) : '') + '\n');
}
module.exports = function run(files) {
    if (process.env.USE_BABEL_REGISTER === 'yes') {
        console.log(colors.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly, ' +
            'use the -v option for more info.'), '\n\n');
        require('babel-register')({
            ignore: /node_modules/
        });
    }
    if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
        console.log(' => Suman debug message => we are in SUMAN_SINGLE_PROCESS mode.');
        require('./helpers/log-stdio-of-child')('suman-single-process');
        require('./handle-single-proc')(files);
    }
    else {
        require('./helpers/log-stdio-of-child')(files[0]);
        require(files[0]);
    }
};
