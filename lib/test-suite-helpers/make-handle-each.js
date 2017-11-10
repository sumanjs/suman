'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var assert = require("assert");
var util = require("util");
var chalk = require("chalk");
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var su = require("suman-utils");
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var t_proto_hook_1 = require("./t-proto-hook");
var handle_callback_helper_1 = require("./handle-callback-helper");
var helpers = require('./handle-promise-generator');
var freeze_existing_props_1 = require("freeze-existing-props");
exports.makeHandleBeforeOrAfterEach = function (suman, gracefulExit) {
    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb, retryData) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.log.error('runtime error => uncaughtException experienced => halting program.');
            return;
        }
        aBeforeOrAfterEach.alreadyInitiated = true;
        if (test.skipped || test.stubbed) {
            return process.nextTick(cb);
        }
        var onTimeout = function () {
            var err = general_1.cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR);
            err.sumanExitCode = constants.EXIT_CODES.HOOK_TIMED_OUT_ERROR;
            fini(err, true);
        };
        var timerObj = {
            timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfterEach.timeout)
        };
        var assertCount = {
            num: 0
        };
        var d = domain.create();
        d.sumanEachHook = true;
        d.sumanEachHookName = aBeforeOrAfterEach.desc || '(unknown hook name)';
        d.testDescription = test.desc || '(unknown test case name)';
        var fini = handle_callback_helper_1.makeCallback(d, assertCount, null, aBeforeOrAfterEach, timerObj, gracefulExit, cb);
        var fnStr = aBeforeOrAfterEach.fn.toString();
        var dError = false, retries;
        if (suman.config.retriesEnabled === true && Number.isInteger((retries = test.retries))) {
            _suman.log.warning('enabled retries.');
            fini.retryFn = retryData ? retryData.retryFn : handleBeforeOrAfterEach.bind(null, arguments);
        }
        var handlePossibleError = function (err) {
            err ? handleError(err) : fini(null);
        };
        var handleError = function (err) {
            if (aBeforeOrAfterEach.dynamicallySkipped === true) {
                return fini(null);
            }
            if (fini.retryFn) {
                if (!retryData) {
                    return fini.retryFn({ retryFn: fini.retryFn, retryCount: 1, maxRetries: retries });
                }
                else if (retryData.retryCount < retries) {
                    retryData.retryCount++;
                    return fini.retryFn(retryData);
                }
                else {
                    _suman.log.error('maximum retries attempted.');
                }
            }
            err = err || new Error('unknown/falsy hook error.');
            if (typeof err === 'string') {
                err = new Error(err);
            }
            var stk = err.stack || err;
            var stck = typeof stk === 'string' ? stk : util.inspect(stk);
            var formatedStk = String(stck).split('\n').map(function (item) { return '\t' + item; }).join('\n');
            if (!dError) {
                dError = true;
                if (aBeforeOrAfterEach.fatal === false) {
                    _suman.writeTestError(constants.SUMAN_HOOK_FATAL_WARNING_MESSAGE + formatedStk);
                    fini(null);
                }
                else {
                    gracefulExit({
                        sumanFatal: true,
                        sumanExitCode: constants.EXIT_CODES.FATAL_HOOK_ERROR,
                        stack: constants.SUMAN_HOOK_FATAL_MESSAGE + formatedStk
                    });
                }
            }
            else {
                d.removeAllListeners();
                _suman.writeTestError(' => Suman error => Error in hook => \n' + stk);
            }
        };
        d.on('error', handleError);
        process.nextTick(function () {
            var sumanOpts = _suman.sumanOpts;
            _suman.activeDomain = d;
            if (sumanOpts.debug_hooks) {
                _suman.log.info("now running each hook with name '" + chalk.yellow.bold(aBeforeOrAfterEach.desc) + "', " +
                    ("for test case with name '" + chalk.magenta(test.desc) + "'."));
            }
            d.run(function runHandleEachHook() {
                var isAsyncAwait = false;
                var isGeneratorFn = su.isGeneratorFn(aBeforeOrAfterEach.fn);
                if (fnStr.indexOf('async') === 0) {
                    isAsyncAwait = true;
                }
                var timeout = function (val) {
                    clearTimeout(timerObj.timer);
                    assert(val && Number.isInteger(val), 'value passed to timeout() must be an integer.');
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 500000 : val);
                };
                var handleNonCallbackMode = function (err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                };
                var t = t_proto_hook_1.makeHookObj(aBeforeOrAfterEach, assertCount, handleError, handlePossibleError);
                fini.th = t;
                t.timeout = timeout;
                t.test = {};
                t.test.desc = test.desc;
                t.test.testId = test.testId;
                if (aBeforeOrAfterEach.type === 'afterEach/teardownTest') {
                    t.test.result = test.error ? 'failed' : 'passed';
                    t.test.error = test.error;
                }
                t.data = test.data;
                t.desc = aBeforeOrAfterEach.desc;
                t.value = test.value;
                t.state = 'pending';
                t.shared = self.shared;
                t.__inject = self.$inject;
                t.$inject = self.$inject;
                t.fatal = function fatal(err) {
                    if (!t.callbackMode) {
                        handleNonCallbackMode(err);
                    }
                    else {
                        err = err || new Error('Stand-in error, since user did not provide one.');
                        err.sumanFatal = true;
                        handleError(err);
                    }
                };
                var args;
                if (isGeneratorFn) {
                    var handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfterEach);
                    args = [freeze_existing_props_1.freezeExistingProps(t)];
                    handlePotentialPromise(helpers.handleGenerator(aBeforeOrAfterEach.fn, args));
                }
                else if (aBeforeOrAfterEach.cb) {
                    t.callbackMode = true;
                    var dne = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            err && (err.sumanFatal = Boolean(sumanOpts.bail));
                            handlePossibleError(err);
                        }
                    };
                    t.done = dne;
                    t.ctn = t.pass = function () {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(undefined);
                        }
                        else {
                            fini(null);
                        }
                    };
                    args = Object.setPrototypeOf(dne, freeze_existing_props_1.freezeExistingProps(t));
                    if (aBeforeOrAfterEach.fn.call(null, args)) {
                        _suman.writeTestError(general_1.cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfterEach);
                    args = freeze_existing_props_1.freezeExistingProps(t);
                    handlePotentialPromise(aBeforeOrAfterEach.fn.call(null, args), false);
                }
            });
        });
    };
};
