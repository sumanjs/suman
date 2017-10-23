'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var EE = require("events");
var fs = require("fs");
var suman_events_1 = require("suman-events");
var su = require("suman-utils");
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var handle_runner_request_response_1 = require("../index-helpers/handle-runner-request-response");
var handle_suman_once_post_1 = require("./handle-suman-once-post");
var general_1 = require("./general");
var socketio_child_client_1 = require("../index-helpers/socketio-child-client");
var reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
var suiteResultEmitter = _suman.suiteResultEmitter = _suman.suiteResultEmitter || new EE();
var rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();
var results = _suman.tableResults = _suman.tableResults || [];
var isShutdown = false;
exports.shutdownProcess = function () {
    if (isShutdown) {
        _suman.logWarning('implementation error, process shutdown has already commenced.');
        return;
    }
    else {
        isShutdown = true;
    }
    var fn, resultz;
    if (_suman.usingRunner) {
        resultz = results.map(function (i) { return i.tableData; });
        _suman.logError('handling request/response with runner.');
        fn = handle_runner_request_response_1.handleRequestResponseWithRunner(resultz);
    }
    else if (_suman.inBrowser) {
        console.log('stable dogs here...');
        resultz = results.map(function (i) { return i.tableData; });
        fn = handle_runner_request_response_1.handleRequestResponseWithRunner(resultz);
    }
    else {
        resultz = results.map(function (i) { return i ? i : null; }).filter(function (i) { return i; });
        resultz.forEach(function (r) {
            rb.emit(String(suman_events_1.events.STANDARD_TABLE), r.tableData, r.exitCode);
        });
        fn = handle_suman_once_post_1.oncePostFn;
    }
    var codes = results.map(function (i) { return i.exitCode; });
    if (su.vgt(6)) {
        _suman.log(' => All "exit" codes from test suites => ', util.inspect(codes));
    }
    var highestExitCode = Math.max.apply(null, codes);
    fn(function (err) {
        err && _suman.logError(err.stack || err);
        rb.emit(String(suman_events_1.events.META_TEST_ENDED));
        _suman.endLogStream && _suman.endLogStream();
        var waitForStdioToDrain = function (cb) {
            if (_suman.inBrowser) {
                _suman.log('we are in browser no drain needed.');
                return process.nextTick(cb);
            }
            if (_suman.isStrmDrained) {
                _suman.log('Log stream is already drained.');
                return process.nextTick(cb);
            }
            var timedout = false;
            var timeout = _suman.usingRunner ? 20 : 10;
            var onTimeout = function () {
                timedout = true;
                cb(null);
            };
            var to = setTimeout(onTimeout, timeout);
            _suman.drainCallback = function (logpath) {
                clearTimeout(to);
                _suman.logWarning('Drain callback was actually called.');
                try {
                    fs.appendFileSync(logpath, 'Drain callback was indeed called.');
                }
                finally {
                    console.log('we are in finally...');
                    if (!timedout) {
                        console.log('finally has not timedout...');
                        process.nextTick(cb);
                    }
                }
            };
        };
        async.parallel([
            waitForStdioToDrain,
            general_1.makeHandleAsyncReporters(reporterRets),
        ], function () {
            try {
                if (window) {
                    var childId = window.__suman.SUMAN_CHILD_ID;
                    var client = socketio_child_client_1.getClient();
                    client.emit('BROWSER_FINISHED', {
                        childId: childId,
                        type: 'BROWSER_FINISHED',
                    }, function () {
                        console.log('BROWSER_FINISHED message received.');
                    });
                }
            }
            catch (err) {
                process.exit(highestExitCode);
            }
        });
    });
};
exports.handleSingleFileShutdown = function () {
    suiteResultEmitter.once('suman-test-file-complete', exports.shutdownProcess);
};
