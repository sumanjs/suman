'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var constants = require('../config/suman-constants').constants;
var acquireDependencies = require('./acquire-dependencies/acquire-pre-deps').acquireDependencies;
exports.run = function (files) {
    async.eachLimit(files, 1, function (f, cb) {
        var fullPath = f[0];
        var shortenedPath = f[1];
        console.log('\n');
        _suman.log('is now running testsuites for test filename => "' + shortenedPath + '"', '\n');
        require(fullPath);
        suiteResultEmitter.once('suman-test-file-complete', function () {
            cb(null);
        });
    }, function (err, results) {
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
