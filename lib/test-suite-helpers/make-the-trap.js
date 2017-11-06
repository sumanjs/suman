'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var async = require("async");
var suman_events_1 = require("suman-events");
var _ = require("lodash");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var make_handle_test_1 = require("./make-handle-test");
var make_handle_each_1 = require("./make-handle-each");
var general_1 = require("../helpers/general");
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var testErrors = _suman.testErrors = _suman.testErrors || [];
var errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var getAllBeforesEaches = function (zuite) {
    var beforeEaches = [];
    beforeEaches.unshift(zuite.getBeforeEaches());
    if (!zuite.alreadyHandledAfterAllParentHooks) {
        zuite.alreadyHandledAfterAllParentHooks = true;
        beforeEaches.unshift(zuite.getAfterAllParentHooks());
    }
    var getParentBefores = function (parent) {
        beforeEaches.unshift(parent.getBeforeEaches());
        if (parent.parent) {
            getParentBefores(parent.parent);
        }
    };
    if (zuite.parent) {
        getParentBefores(zuite.parent);
    }
    return _.flatten(beforeEaches);
};
var getAllAfterEaches = function (zuite) {
    var afterEaches = [];
    afterEaches.push(zuite.getAfterEaches());
    var getParentAfters = function (parent) {
        afterEaches.push(parent.getAfterEaches());
        if (parent.parent) {
            getParentAfters(parent.parent);
        }
    };
    if (zuite.parent) {
        getParentAfters(zuite.parent);
    }
    return _.flatten(afterEaches);
};
var stckMapFn = function (item, index) {
    var fst = _suman.sumanOpts && _suman.sumanOpts.full_stack_traces;
    if (!item) {
        return '';
    }
    if (index === 0) {
        return '\t' + item;
    }
    if (fst) {
        return su.padWithXSpaces(4) + item;
    }
    if ((String(item).match(/\//) || String(item).match('______________')) && !String(item).match(/\/node_modules\//) &&
        !String(item).match(/internal\/process\/next_tick.js/)) {
        return su.padWithXSpaces(4) + item;
    }
};
var makeHandleTestResults = function (suman) {
    return function handleTestError(err, test) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.log.error("runtime error => \"UncaughtException:Triggered\" => halting program.\n[" + __filename + "]");
            return;
        }
        test.error = null;
        if (err) {
            var sumanFatal = err.sumanFatal;
            if (err instanceof Error) {
                test.error = err;
                test.errorDisplay = String(err.stack).split('\n')
                    .concat("\t" + su.repeatCharXTimes('_', 70))
                    .map(stckMapFn)
                    .filter(function (item) { return item; })
                    .join('\n')
                    .concat('\n');
            }
            else if (typeof err.stack === 'string') {
                test.error = err;
                test.errorDisplay = String(err.stack).split('\n')
                    .concat("\t" + su.repeatCharXTimes('_', 70))
                    .map(stckMapFn)
                    .filter(function (item) { return item; })
                    .join('\n')
                    .concat('\n');
            }
            else {
                throw new Error('Suman internal implementation error => invalid error format, please report this.');
            }
            if (su.isSumanDebug()) {
                _suman.writeTestError('\n\nTest error: ' + test.desc + '\n\t' + 'stack: ' + test.error.stack + '\n\n');
            }
            testErrors.push(test.error);
        }
        if (test.error) {
            test.error.isFromTest = true;
        }
        suman.logResult(test);
        return test.error;
    };
};
exports.makeTheTrap = function (suman, gracefulExit) {
    var handleTest = make_handle_test_1.makeHandleTest(suman, gracefulExit);
    var handleTestResult = makeHandleTestResults(suman);
    var handleBeforeOrAfterEach = make_handle_each_1.makeHandleBeforeOrAfterEach(suman, gracefulExit);
    return function runTheTrap(self, test, opts, cb) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.log.error("runtime error => \"uncaughtException\" event => halting program.\n[" + __filename + "]");
            return;
        }
        var sumanOpts = suman.opts, sumanConfig = suman.config;
        var delaySum = 0;
        if (test.stubbed) {
            rb.emit(String(suman_events_1.events.TEST_CASE_END), test);
            rb.emit(String(suman_events_1.events.TEST_CASE_STUBBED), test);
            return process.nextTick(cb, null);
        }
        if (test.skipped) {
            rb.emit(String(suman_events_1.events.TEST_CASE_END), test);
            rb.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), test);
            return process.nextTick(cb, null);
        }
        var parallel = sumanOpts.parallel || (opts.parallel && !_suman.sumanOpts.series);
        async.eachSeries(getAllBeforesEaches(self), function (aBeforeEach, cb) {
            handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
        }, function doneWithBeforeEaches(err) {
            general_1.implementationError(err);
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
                            general_1.implementationError(err);
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
                        general_1.implementationError(err);
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
