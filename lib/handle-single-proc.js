'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var EE = require("events");
var async = require("async");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var constants = require('../config/suman-constants').constants;
exports.run = function (files) {
    _suman.log(chalk.magenta('suman will run the following files in single process mode:'));
    _suman.log(util.inspect(files.map(function (v) { return v[0]; })));
    async.eachLimit(files, 5, function (f, cb) {
        var fullPath = f[0];
        var shortenedPath = f[1];
        console.log('\n');
        _suman.log('is now running test with filename => "' + shortenedPath + '"', '\n');
        suiteResultEmitter.once('suman-test-file-complete', function () {
            cb(null);
        });
        require(fullPath);
    }, function (err) {
        if (err) {
            console.error(err.stack || err || 'no error passed to error handler.');
            process.exit(1);
        }
        else {
            console.log('\n');
            _suman.log('SUMAN_SINGLE_PROCESS run is now complete.');
            console.log('\n');
            _suman.log('Time required for all tests in single process => ', Date.now() - _suman.sumanSingleProcessStartTime);
            process.exit(0);
        }
    });
};
