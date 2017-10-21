'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var async = require("async");
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var makeHandleTestResults = require('./handle-test-result').makeHandleTestResults;
var makeHandleTest = require('./make-handle-test').makeHandleTest;
var _a = require('./get-all-eaches'), getAllAfterEaches = _a.getAllAfterEaches, getAllBeforesEaches = _a.getAllBeforesEaches;
var make_handle_each_1 = require("./make-handle-each");
var implementationError = require('../helpers/implementation-error');
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeTheTrap = function (suman, gracefulExit) {
    var allDescribeBlocks = suman.allDescribeBlocks;
    var handleTest = makeHandleTest(suman, gracefulExit);
    var handleTestResult = makeHandleTestResults(suman);
    var handleBeforeOrAfterEach = make_handle_each_1.makeHandleBeforeOrAfterEach(suman, gracefulExit);
    return function runTheTrap(self, test, opts, cb) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.logError("runtime error => \"uncaughtException\" event => halting program.\n[" + __filename + "]");
            return;
        }
        var sumanOpts = _suman.sumanOpts, sumanConfig = suman.config;
        var delaySum = 0;
        if (test.stubbed) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END), test);
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_STUBBED), test);
            return process.nextTick(cb, null);
        }
        if (test.skipped) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END), test);
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), test);
            return process.nextTick(cb, null);
        }
        var parallel = sumanOpts.parallel || (opts.parallel && !_suman.sumanOpts.series);
        async.eachSeries(getAllBeforesEaches(self), function (aBeforeEach, cb) {
            handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
        }, function doneWithBeforeEaches(err) {
            implementationError(err);
            if (parallel) {
                delaySum += (test.delay || 0);
            }
            else {
                delaySum = 0;
            }
            async.series([
                function (cb) {
                    var handleTestContainer = function () {
                        handleTest(self, test, function (err, result) {
                            implementationError(err);
                            var $result = handleTestResult(result, test);
                            if (sumanOpts.bail) {
                                gracefulExit($result, function () {
                                    process.nextTick(cb, null, result);
                                });
                            }
                            else {
                                process.nextTick(cb, null, result);
                            }
                        });
                    };
                    if (delaySum) {
                        setTimeout(handleTestContainer, delaySum);
                    }
                    else {
                        handleTestContainer();
                    }
                },
                function (cb) {
                    async.eachSeries(getAllAfterEaches(self), function (aAfterEach, cb) {
                        handleBeforeOrAfterEach(self, test, aAfterEach, cb);
                    }, function done(err) {
                        implementationError(err);
                        process.nextTick(cb);
                    });
                }
            ], function doneWithTests(err, results) {
                err && console.error('Suman implementation error => the following error should not be present => ', err);
                cb(null, results);
            });
        });
    };
};
