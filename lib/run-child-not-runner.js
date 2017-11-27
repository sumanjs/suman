'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var util = require("util");
var su = require("suman-utils");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants').constants;
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
process.on('uncaughtException', function (err) {
    debugger;
    if (!err) {
        err = new Error('falsy value passed to uncaught exception handler.');
    }
    if (typeof err !== 'object') {
        var val = typeof err === 'string' ? err : util.inspect(err);
        _suman.log.error('\n\n', chalk.red(' => Implementation warning: value passed to uncaughtException handler ' +
            'was not typeof "object" => '), val, '\n\n');
        err = { message: val, stack: val };
    }
    setTimeout(function () {
        if (err && !err._alreadyHandledBySuman) {
            _suman.log.error('\n', ' => Suman uncaught exception =>', '\n', (err.stack || err), '\n\n');
        }
        process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    }, 500);
});
var sumanOpts = _suman.sumanOpts;
var sumanHelperDirRoot = _suman.sumanHelperDirRoot;
var sumanConfig = _suman.sumanConfig;
var useBabelRegister = _suman.useBabelRegister = sumanOpts.$useBabelRegister;
exports.run = function (files) {
    if (useBabelRegister) {
        console.log(chalk.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly'));
        console.log(chalk.bgWhite.black.bold('use the -v option for more info.'));
        console.log('\n\n');
        require('babel-register')({
            ignore: /node_modules/
        });
    }
    try {
        require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));
    }
    catch (err) {
        _suman.log.error('\n', chalk.yellow.bold(' => Suman usage warning => Could not load your suman.globals.js file.'));
        _suman.log.error(err.message || err);
        _suman.log.error(' => Suman will continue optimistically, even though your suman.globals.js file could not be loaded.');
    }
    if (!process.prependListener) {
        process.prependListener = process.on.bind(process);
    }
    if (!process.prependOnceListener) {
        process.prependOnceListener = process.on.bind(process);
    }
    process.prependOnceListener('exit', function (code) {
        if (!_suman.isActualExitHandlerRegistered) {
            _suman.log.error(chalk.magenta('Warning - you may have failed to point Suman to an actual Suman test file.'));
            _suman.log.error(chalk.magenta('Or there was an immediate error, which prevented any other exit handlers from being registered.'));
        }
    });
    if (SUMAN_SINGLE_PROCESS) {
        if (su.vgt(5)) {
            _suman.log.info('We are in "SUMAN_SINGLE_PROCESS" mode: all JavaScript-based tests will be run in a single process.');
        }
        require('./handle-single-proc').run(files);
    }
    else {
        if (su.vgt(5)) {
            _suman.log.info("running this single test file => \"" + chalk.bold(files[0]) + "\"");
        }
        require('./helpers/log-stdio-of-child').run(files[0]);
        require(files[0]);
    }
};
