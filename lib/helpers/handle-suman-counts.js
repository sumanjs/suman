'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var fs = require("fs");
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var handle_runner_request_response_1 = require("../index-helpers/handle-runner-request-response");
var counts = require('./suman-counts');
var handle_suman_once_post_1 = require("./handle-suman-once-post");
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var results = _suman.tableResults = (_suman.tableResults || []);
suiteResultEmitter.once('suman-test-file-complete', function () {
    var fn, resultz;
    if (_suman.usingRunner) {
        resultz = results.map(function (i) { return i.tableData; });
        _suman.logError('handling request/response with runner.');
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
    var highestExitCode = Math.max.apply(null, codes);
    fn(function (err) {
        err && _suman.logError(err.stack || err);
        resultBroadcaster.emit(String(suman_events_1.events.META_TEST_ENDED));
        _suman.endLogStream && _suman.endLogStream();
        var waitForStdioToDrain = function (cb) {
            if (_suman.isStrmDrained) {
                _suman.log('Log stream is already drained.');
                return process.nextTick(cb);
            }
            var timedout = false;
            var to = setTimeout(function () {
                timedout = true;
                _suman.logWarning('Drain callback timed out, exitting.');
                cb(null);
            }, _suman.usingRunner ? 20 : 10);
            _suman.drainCallback = function (logpath) {
                clearTimeout(to);
                _suman.logWarning('Drain callback was actually called.');
                try {
                    fs.appendFileSync(logpath, 'Drain callback was indeed called.');
                }
                finally {
                    if (!timedout) {
                        process.nextTick(cb);
                    }
                }
            };
        };
        waitForStdioToDrain(function () {
            _suman.log('suman child is all done and exitting.');
            process.exit(highestExitCode);
        });
    });
});
