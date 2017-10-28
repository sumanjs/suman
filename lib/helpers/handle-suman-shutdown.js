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
        _suman.log.warning('implementation error, process shutdown has already commenced.');
        return;
    }
    isShutdown = true;
    var fn, resultz;
    if (_suman.usingRunner) {
        resultz = results.map(function (i) { return i.tableData; });
        fn = handle_runner_request_response_1.handleRequestResponseWithRunner(resultz);
    }
    else if (_suman.inBrowser) {
        resultz = results.map(function (i) { return i.tableData; });
        fn = handle_runner_request_response_1.handleRequestResponseWithRunner(resultz);
    }
    else {
        resultz = results.filter(function (r) { return r; });
        resultz.forEach(function (r) {
            rb.emit(String(suman_events_1.events.STANDARD_TABLE), r.tableData, r.exitCode);
        });
        fn = handle_suman_once_post_1.oncePostFn;
    }
    var codes = results.map(function (i) { return i.exitCode; });
    if (su.vgt(6)) {
        _suman.log.info(' => All "exit" codes from test suites => ', util.inspect(codes));
    }
    var highestExitCode = Math.max.apply(null, codes);
    fn(function (err) {
        err && _suman.log.error(err.stack || err);
        rb.emit(String(suman_events_1.events.META_TEST_ENDED));
        _suman.endLogStream && _suman.endLogStream();
        var waitForStdioToDrain = function (cb) {
            if (_suman.inBrowser) {
                _suman.log.info('we are in browser no drain needed.');
                return process.nextTick(cb);
            }
            if (_suman.isStrmDrained) {
                _suman.log.info('Log stream is already drained.');
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
                _suman.log.warning('Drain callback was actually called.');
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
        async.parallel({
            wait: waitForStdioToDrain,
            reporters: general_1.makeHandleAsyncReporters(reporterRets),
        }, function (err, results) {
            var exitCode = String(results.reporters ? results.reporters.exitCode : '0');
            try {
                if (window && !window.__karma__) {
                    var childId = window.__suman.SUMAN_CHILD_ID;
                    var client = socketio_child_client_1.getClient();
                    client.emit('BROWSER_FINISHED', {
                        childId: childId,
                        exitCode: exitCode,
                        type: 'BROWSER_FINISHED',
                    }, function () {
                        console.error('"BROWSER_FINISHED" message received by Suman runner.');
                        console.error('If you can see this message, it is likely that the Suman runner was not able to close the browser process.');
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
