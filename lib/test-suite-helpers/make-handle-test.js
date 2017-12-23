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
var test_case_param_1 = require("../test-suite-params/test-case/test-case-param");
var rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();
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
        var timerObj = {
            timer: null
        };
        var assertCount = {
            num: 0
        };
        var d = domain.create();
        d.sumanTestCase = true;
        d.sumanTestName = test.desc;
        var fnStr = test.fn.toString();
        var fini = make_fini_callbacks_1.makeTestCaseCallback(d, assertCount, test, timerObj, gracefulExit, cb);
        var derror = false, retries;
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
            var errMessage = err && (err.stack || err.message || util.inspect(err));
            err = general_1.cloneError(test.warningErr, errMessage, false);
            var stk = err.stack || err;
            var stack = typeof stk === 'string' ? stk : util.inspect(stk);
            if (!derror) {
                derror = true;
                fini({ stack: stack });
            }
            else {
                d.removeAllListeners();
                _suman.writeTestError('Suman error => Error in test => \n' + stack);
            }
        };
        if (suman.config.retriesEnabled === true && Number.isInteger((retries = test.retries))) {
            fini.retryFn = retryData ? retryData.retryFn : handleTest.bind.apply(handleTest, [null].concat(arguments));
        }
        else if (test.retries && !Number.isInteger(test.retries)) {
            return handleErr(new Error('retries property is not an integer => ' + util.inspect(test.retries)));
        }
        if (test.failed) {
            assert(test.error, 'Suman implementation error: error property should be defined at this point in the program.');
            return handleErr(test.error || new Error('Suman implementation error - <test.error> was falsy.'));
        }
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
                if (fnStr.indexOf('async') === 0) {
                    isAsyncAwait = true;
                    warn = true;
                }
                var t = new test_case_param_1.TestCaseParam(test, assertCount, handleErr, fini, timerObj);
                fini.thot = t;
                t.__shared = self.shared;
                t.__supply = self.supply;
                t.supply = new Proxy(self.__supply, {
                    set: t.__inheritedSupply.bind(t)
                });
                test.dateStarted = Date.now();
                if (su.isGeneratorFn(test.fn)) {
                    var handlePotentialPromise = helpers.handleReturnVal(t.handlePossibleError.bind(t), fnStr, test);
                    handlePotentialPromise(helpers.handleGenerator(test.fn, t));
                }
                else if (test.cb === true) {
                    t.callbackMode = true;
                    var dne = function done(err) {
                        t.callbackMode ? t.handlePossibleError(err) : t.handleNonCallbackMode(err);
                    };
                    t.done = dne;
                    var arg = Object.setPrototypeOf(dne, t);
                    if (test.fn.call(null, arg)) {
                        _suman.writeTestError(general_1.cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handleReturnVal(t.handlePossibleError.bind(t), fnStr, test);
                    handlePotentialPromise(test.fn.call(null, t), warn, d);
                }
            });
        });
    };
};
