'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var fs = require("fs");
var suman_events_1 = require("suman-events");
var su = require("suman-utils");
var chalk = require("chalk");
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
    console.error(chalk.red("suman completed count " + counts.completedCount));
    if (counts.completedCount === counts.sumanCount) {
        var fn = void 0, resultz = void 0;
        if (_suman.usingRunner) {
            resultz = results.map(function (i) { return i.tableData; });
            fn = handle_runner_request_response_1.handleRequestResponseWithRunner(resultz);
        }
        else {
            resultz = results.map(function (i) { return i ? i : null; }).filter(function (i) { return i; });
            resultz.forEach(function (r) {
                resultBroadcaster.emit(String(suman_events_1.events.STANDARD_TABLE), r.tableData, r.exitCode);
            });
            fn = handle_suman_once_post_1.oncePostFn;
        }
        var codes = results.map(function (i) { return i.exitCode; });
        _suman.log(' => All "exit" codes from test suites => ', codes);
        var highestExitCode_1 = Math.max.apply(null, codes);
        fn(function (err) {
            err && _suman.logError(err.stack || err);
            resultBroadcaster.emit(String(suman_events_1.events.META_TEST_ENDED));
            process.exit(highestExitCode_1, su.once(null, function (cb) {
                if (_suman.isStrmDrained) {
                    _suman.log('stream is already drained.');
                    process.nextTick(cb);
                }
                else {
                    var to_1 = setTimeout(cb, 100);
                    _suman.drainCallback = function (logpath) {
                        clearTimeout(to_1);
                        _suman.logWarning('Drain callback was indeed called.');
                        try {
                            fs.appendFileSync(logpath, 'Drain callback was indeed called.');
                        }
                        finally {
                            process.nextTick(cb);
                        }
                    };
                }
            }));
        });
    }
    else if (counts.completedCount > counts.sumanCount) {
        throw new Error('Suman internal implementation error => completedCount should never be greater than sumanCount.');
    }
});
