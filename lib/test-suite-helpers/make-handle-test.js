'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var assert = require("assert");
var util = require("util");
var EE = require("events");
var chalk = require("chalk");
var fnArgs = require('function-arguments');
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var su = require("suman-utils");
var handle_callback_helper_1 = require("./handle-callback-helper");
var helpers = require('./handle-promise-generator');
var clone_error_1 = require("../misc/clone-error");
var t_proto_test_1 = require("./t-proto-test");
var freeze_existing_props_1 = require("freeze-existing-props");
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeHandleTest = function (suman, gracefulExit) {
    return function handleTest(self, test, cb) {
        test.alreadyInitiated = true;
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.logError("runtime error => \"UncaughtException:Triggered\" => halting program.\n[" + __filename + "]");
            return;
        }
        if (test.stubbed) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END), test);
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_STUBBED), test);
            return process.nextTick(cb);
        }
        if (test.skipped) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END), test);
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), test);
            return process.nextTick(cb);
        }
        var onTimeout = function () {
            test.timedOut = true;
            var err = clone_error_1.cloneError(test.warningErr, constants.warnings.TEST_CASE_TIMED_OUT_ERROR);
            err.isFromTest = true;
            fini(err, true);
        };
        var timerObj = {
            timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : test.timeout)
        };
        var d = domain.create();
        d.sumanTestCase = true;
        d.sumanTestName = test.desc;
        var assertCount = {
            num: 0
        };
        var fnStr = test.fn.toString();
        var fini = handle_callback_helper_1.makeCallback(d, assertCount, test, null, timerObj, gracefulExit, cb);
        var derror = false;
        var handleErr = function (err) {
            err = err || new Error('unknown hook error.');
            if (typeof err === 'string') {
                err = new Error(err);
            }
            var stk = err.stack || err;
            var stack = typeof stk === 'string' ? stk : util.inspect(stk);
            if (!derror) {
                derror = true;
                fini({ stack: stack });
            }
            else {
                _suman.writeTestError('Suman error => Error in test => \n' + stack);
            }
        };
        d.on('error', handleErr);
        process.nextTick(function () {
            var sumanOpts = _suman.sumanOpts;
            if (sumanOpts.debug_hooks) {
                _suman.log("now starting to run test with name '" + chalk.magenta(test.desc) + "'.");
            }
            d.run(function runHandleTest() {
                var warn = false;
                var isAsyncAwait = false;
                if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
                    warn = true;
                }
                var isGeneratorFn = su.isGeneratorFn(test.fn);
                var timeout = function (val) {
                    clearTimeout(timerObj.timer);
                    assert(val && Number.isInteger(val), 'value passed to timeout() must be an integer.');
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
                };
                var $throw = function (str) {
                    handleErr(str instanceof Error ? str : new Error(str));
                };
                var handle = function (fn) {
                    try {
                        fn.call(self);
                    }
                    catch (e) {
                        handleErr(e);
                    }
                };
                var handleNonCallbackMode = function (err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleErr(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                };
                var t = t_proto_test_1.makeTestCase(test, assertCount, handleErr);
                fini.th = t;
                t.handleAssertions = handle;
                t.throw = $throw;
                t.timeout = timeout;
                t.shared = self.shared;
                t.$inject = suman.$inject;
                t.fatal = function fatal(err) {
                    if (!t.callbackMode) {
                        handleNonCallbackMode(err);
                    }
                    else {
                        err = err || new Error('t.fatal() was called by the developer.');
                        err.sumanFatal = true;
                        fini(err);
                    }
                };
                test.dateStarted = Date.now();
                var args;
                if (isGeneratorFn) {
                    var handleGenerator = helpers.makeHandleGenerator(fini);
                    args = [freeze_existing_props_1.freezeExistingProps(t)];
                    handleGenerator(test.fn, args, self);
                }
                else if (test.cb === true) {
                    t.callbackMode = true;
                    var dne = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err);
                        }
                    };
                    fini.th = dne;
                    t.done = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err);
                        }
                    };
                    t.pass = t.ctn = function pass() {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(undefined);
                        }
                        else {
                            fini(undefined);
                        }
                    };
                    t.fail = function fail(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err || new Error('t.fail() was called on test (note that null/undefined value ' +
                                'was passed as first arg to the fail function.)'));
                        }
                    };
                    args = Object.setPrototypeOf(dne, freeze_existing_props_1.freezeExistingProps(t));
                    if (test.fn.call(self, args)) {
                        _suman.writeTestError(clone_error_1.cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
                    args = freeze_existing_props_1.freezeExistingProps(t);
                    handlePotentialPromise(test.fn.call(self, args), warn, d);
                }
            });
        });
    };
};
