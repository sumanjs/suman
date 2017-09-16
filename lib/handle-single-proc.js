'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants').constants;
var acquireDependencies = require('./acquire-dependencies/acquire-pre-deps').acquireDependencies;
exports.run = function (files) {
    async.eachLimit(files, 1, function (f, cb) {
        var fullPath = f[0];
        var shortenedPath = f[1];
        console.log('\n');
        _suman.log('is now running testsuites for test filename => "' + shortenedPath + '"', '\n');
        var callable = true;
        var first = function () {
            if (callable) {
                callable = false;
                cb.apply(null, arguments);
            }
            else {
                _suman.logError('warning => SUMAN_SINGLE_PROCESS callback fired more than once, ' +
                    'here is the data passed to callback => ', util.inspect(arguments));
            }
        };
        var exportEvents = require(fullPath);
        var counts = exportEvents.counts;
        var currentCount = 0;
        exportEvents
            .on('suman-test-file-complete', function () {
            currentCount++;
            if (currentCount === counts.sumanCount) {
                process.nextTick(function () {
                    exportEvents.removeAllListeners();
                    first(null);
                });
            }
            else if (currentCount > counts.sumanCount) {
                throw new Error(' => Count should never be greater than expected count.');
            }
        })
            .on('test', function (test) {
            test.call(null);
        })
            .once('error', function (e) {
            console.log(e.stack || e || 'no error passed to error handler.');
            first(e);
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
