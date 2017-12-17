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
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var make_fini_callbacks_1 = require("./make-fini-callbacks");
var helpers = require('./handle-promise-generator');
var general_1 = require("../helpers/general");
var t_proto_test_1 = require("./t-proto-test");
var freeze_existing_props_1 = require("freeze-existing-props");
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeHandleTest = function (suman, gracefulExit) {
    return function handleTest(self, test, cb, retryData) {
        test.alreadyInitiated = true;
        if (_suman.uncaughtExceptionTriggered) {
            _suman.log.error("runtime error => \"UncaughtException already occurred\" => halting program.\n[" + __filename + "]");
            return;
        }
        if (test.stubbed) {
            rb.emit(String(suman_events_1.events.TEST_CASE_END), test);
            rb.emit(String(suman_events_1.events.TEST_CASE_STUBBED), test);
            return process.nextTick(cb);
        }
        if (test.skipped) {
            rb.emit(String(suman_events_1.events.TEST_CASE_END), test);
            rb.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), test);
            return process.nextTick(cb);
        }
        var onTimeout = function () {
            test.timedOut = true;
            var err = general_1.cloneError(test.warningErr, constants.warnings.TEST_CASE_TIMED_OUT_ERROR);
            err.isFromTest = true;
            err.isTimeout = true;
            handleErr(err);
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
        var fini = make_fini_callbacks_1.makeTestCaseCallback(d, assertCount, test, timerObj, gracefulExit, cb);
        var derror = false, retries;
        if (suman.config.retriesEnabled === true && Number.isInteger((retries = test.retries))) {
            fini.retryFn = retryData ? retryData.retryFn : handleTest.bind.apply(handleTest, [null].concat(arguments));
        }
        var handleErr = function (err) {
            if (test.dynamicallySkipped === true) {
                err && _suman.log.warning('Test case was dynamically skipped, but error occurred:', err.message || util.inspect(err));
                return fini(null);
            }
            if (fini.retryFn) {
                if (!retryData) {
                    _suman.log.warning('retrying for the first time.');
                    return fini.retryFn({ retryFn: fini.retryFn, retryCount: 1, maxRetries: retries });
                }
                else if (retryData.retryCount < retries) {
                    retryData.retryCount++;
                    _suman.log.warning("retrying for the " + retryData.retryCount + " time.");
                    return fini.retryFn(retryData);
                }
                else {
                    _suman.log.error('maximum retires attempted.');
                }
            }
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
        if (test.failed) {
            assert(test.error, 'Suman implementation error: error property should be defined at this point in the program.');
            return handleErr(test.error);
        }
        var handlePossibleError = function (err) {
            err ? handleErr(err) : fini(null);
        };
        d.on('error', handleErr);
        process.nextTick(function () {
            var sumanOpts = _suman.sumanOpts;
            if (sumanOpts.debug_hooks) {
                _suman.log.info("now starting to run test with name '" + chalk.magenta(test.desc) + "'.");
            }
            d.run(function runHandleTest() {
                _suman.activeDomain = d;
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
                var handleNonCallbackMode = function (err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleErr(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                };
                var t = t_proto_test_1.makeTestCase(test, assertCount, handleErr, handlePossibleError);
                fini.thot = t;
                t.throw = $throw;
                t.timeout = timeout;
                t.__shared = self.shared;
                t.__supply = self.supply;
                t.supply = new Proxy(self.__supply, {
                    set: function (target, property, value, receiver) {
                        throw new Error('cannot set any properties on t.$inject (in test cases).');
                    }
                });
                t.fatal = function fatal(err) {
                    if (!err) {
                        err = new Error('t.fatal() was called by the developer, with a falsy first argument.');
                    }
                    else if (!su.isObject(err)) {
                        var msg = 't.fatal() was called by the developer: ';
                        err = new Error(msg + util.inspect(err));
                    }
                    err.sumanFatal = true;
                    handleErr(err);
                };
                test.dateStarted = Date.now();
                var args;
                if (isGeneratorFn) {
                    var handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, test);
                    args = [freeze_existing_props_1.freezeExistingProps(t)];
                    handlePotentialPromise(helpers.handleGenerator(test.fn, args));
                }
                else if (test.cb === true) {
                    t.callbackMode = true;
                    var dne = function done(err) {
                        t.callbackMode ? handlePossibleError(err) : handleNonCallbackMode(err);
                    };
                    t.done = dne;
                    t.pass = t.ctn = function () {
                        t.callbackMode ? fini(null) : handleNonCallbackMode(null);
                    };
                    t.fail = function fail(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            handleErr(err || new Error('t.fail() was called on test (note that null/undefined value ' +
                                'was passed as first arg to the fail function.)'));
                        }
                    };
                    args = Object.setPrototypeOf(dne, freeze_existing_props_1.freezeExistingProps(t));
                    if (test.fn.call(null, args)) {
                        _suman.writeTestError(general_1.cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, test);
                    args = freeze_existing_props_1.freezeExistingProps(t);
                    handlePotentialPromise(test.fn.call(null, args), warn, d);
                }
            });
        });
    };
};
