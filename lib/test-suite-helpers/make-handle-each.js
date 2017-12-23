'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var util = require("util");
var chalk = require("chalk");
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var su = require("suman-utils");
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var each_hook_param_1 = require("../test-suite-params/each-hook/each-hook-param");
var make_fini_callbacks_1 = require("./make-fini-callbacks");
var helpers = require("./handle-promise-generator");
exports.makeHandleBeforeOrAfterEach = function (suman, gracefulExit) {
    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb, retryData) {
        if (_suman.uncaughtExceptionTriggered) {
            _suman.log.error('runtime error => uncaughtException experienced => halting program.');
            return;
        }
        var sumanOpts = _suman.sumanOpts;
        aBeforeOrAfterEach.alreadyInitiated = true;
        if (test.skipped || test.stubbed) {
            return process.nextTick(cb);
        }
        if (test.failed && aBeforeOrAfterEach.type === 'beforeEach/setupTest') {
            return process.nextTick(cb);
        }
        var timerObj = {
            timer: null
        };
        var assertCount = {
            num: 0
        };
        var d = domain.create();
        d.sumanEachHook = true;
        d.sumanEachHookName = aBeforeOrAfterEach.desc || '(unknown hook name)';
        d.testDescription = test.desc || '(unknown test case name)';
        var fini = make_fini_callbacks_1.makeEachHookCallback(d, assertCount, aBeforeOrAfterEach, timerObj, gracefulExit, cb);
        var fnStr = aBeforeOrAfterEach.fn.toString();
        var dError = false, retries;
        if (suman.config.retriesEnabled === true && Number.isInteger((retries = test.retries))) {
            _suman.log.warning('enabled retries.');
            fini.retryFn = retryData ? retryData.retryFn : handleBeforeOrAfterEach.bind(null, arguments);
        }
        var handlePossibleError = function (err) {
            if (err) {
                if (typeof err !== 'object') {
                    err = new Error(util.inspect(err));
                }
                err.sumanFatal = Boolean(sumanOpts.bail);
                handleError(err);
            }
            else {
                fini(null);
            }
        };
        var handleError = function (err) {
            if (aBeforeOrAfterEach.dynamicallySkipped === true) {
                err && _suman.log.warning('Hook was dynamically skipped, but error occurred:', err.message || util.inspect(err));
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
                    _suman.log.error('Maximum retries attempted.');
                }
            }
            var errMessage = err && (err.stack || err.message || util.inspect(err));
            err = general_1.cloneError(aBeforeOrAfterEach.warningErr, errMessage, false);
            test.failed = true;
            test.error = err;
            var stk = err.stack || err;
            var formatedStk = typeof stk === 'string' ? stk : util.inspect(stk);
            if (!dError) {
                dError = true;
                if (aBeforeOrAfterEach.fatal !== true) {
                    _suman.log.warning(chalk.black.bold('Error in each hook:'));
                    _suman.log.warning(formatedStk);
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
                _suman.writeTestError('Suman error => Error in each hook => \n' + stk);
            }
        };
        d.on('error', handleError);
        process.nextTick(function () {
            _suman.activeDomain = d;
            if (sumanOpts.debug_hooks) {
                _suman.log.info("now running each hook with name '" + chalk.yellow.bold(aBeforeOrAfterEach.desc) + "', " +
                    ("for test case with name '" + chalk.magenta(test.desc) + "'."));
            }
            d.run(function runHandleEachHook() {
                var isAsyncAwait = false;
                if (fnStr.indexOf('async') === 0) {
                    isAsyncAwait = true;
                }
                var h = new each_hook_param_1.EachHookParam(aBeforeOrAfterEach, assertCount, handleError, fini, timerObj);
                fini.thot = h;
                h.test = {};
                h.test.desc = test.desc;
                h.test.testId = test.testId;
                if (aBeforeOrAfterEach.type === 'afterEach/teardownTest') {
                    h.test.result = test.error ? 'failed' : 'passed';
                    h.test.error = test.error || null;
                }
                h.data = test.data;
                h.desc = aBeforeOrAfterEach.desc;
                h.value = test.value;
                h.state = 'pending';
                h.__shared = self.shared;
                h.supply = h.__supply = self.supply;
                if (su.isGeneratorFn(aBeforeOrAfterEach.fn)) {
                    var handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfterEach);
                    handlePotentialPromise(helpers.handleGenerator(aBeforeOrAfterEach.fn, h));
                }
                else if (aBeforeOrAfterEach.cb) {
                    h.callbackMode = true;
                    var dne = function (err) {
                        h.callbackMode ? h.handlePossibleError(err) : h.handleNonCallbackMode(err);
                    };
                    h.done = dne;
                    var arg = Object.setPrototypeOf(dne, h);
                    if (aBeforeOrAfterEach.fn.call(null, arg)) {
                        _suman.writeTestError(general_1.cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfterEach);
                    handlePotentialPromise(aBeforeOrAfterEach.fn.call(null, h), false);
                }
            });
        });
    };
};
