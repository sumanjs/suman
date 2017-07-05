'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var EE = require('events');
var fs = require('fs');
var suman_events_1 = require("suman-events");
var su = require('suman-utils');
var _suman = global.__suman = (global.__suman || {});
var handle_runner_request_response_1 = require("../index-helpers/handle-runner-request-response");
var counts = require('./suman-counts');
var handle_suman_once_post_1 = require("./handle-suman-once-post");
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var results = [];
suiteResultEmitter.on('suman-completed', function (obj) {
    counts.completedCount++;
    results.push(obj);
    if (counts.completedCount === counts.sumanCount) {
        var fn = void 0;
        var resultz = void 0;
        if (_suman.usingRunner) {
            resultz = results.map(function (i) { return i.tableData; });
            fn = handle_runner_request_response_1.handleRequestResponseWithRunner(resultz);
        }
        else {
            resultz = results.map(function (i) { return i ? i.tableData : null; }).filter(function (i) { return i; });
            resultz.forEach(function (table) {
                resultBroadcaster.emit(String(suman_events_1.events.STANDARD_TABLE), table);
            });
            fn = handle_suman_once_post_1.default;
        }
        var codes = results.map(function (i) { return i.exitCode; });
        if (su.isSumanDebug()) {
            console.log(' => All "exit" codes from test suites => ', codes);
        }
        var highestExitCode_1 = Math.max.apply(null, codes);
        fn(function (err) {
            if (err) {
                console.error(err.stack || err);
            }
            resultBroadcaster.emit(String(suman_events_1.events.META_TEST_ENDED));
            process.exit(highestExitCode_1, function (cb) {
                if (_suman.isStrmDrained) {
                    console.log('Strm is already drained.');
                    cb();
                }
                else {
                    var to_1 = setTimeout(function () {
                        _suman.drainCallback = function () {
                        };
                        cb();
                    }, 100);
                    _suman.drainCallback = function (logpath) {
                        clearTimeout(to_1);
                        console.log(' => Drain callback called yes.');
                        try {
                            fs.appendFileSync(logpath, ' => Drain callback called yes.');
                        }
                        finally {
                            cb();
                        }
                    };
                }
            });
        });
    }
    else if (counts.completedCount > counts.sumanCount) {
        throw new Error('=> Suman internal implementation error => ' +
            'completedCount should never be greater than sumanCount.');
    }
});
