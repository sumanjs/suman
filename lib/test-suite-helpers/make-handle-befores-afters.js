'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var util = require("util");
var suman_utils_1 = require("suman-utils");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var make_fini_callbacks_1 = require("./make-fini-callbacks");
var helpers = require("./handle-promise-generator");
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var all_hook_param_1 = require("../test-suite-params/all-hook/all-hook-param");
exports.makeHandleBeforesAndAfters = function (suman, gracefulExit) {
    return function handleBeforesAndAfters(self, aBeforeOrAfter, cb, retryData) {
        if (_suman.uncaughtExceptionTriggered) {
            _suman.log.error("runtime error => \"UncaughtException already occurred\" => halting program in file:\n[" + __filename + "]");
            return;
        }
        aBeforeOrAfter.alreadyInitiated = true;
        var onTimeout = function () {
            fini(general_1.cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
        };
        var timerObj = {
            timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfter.timeout)
        };
        var assertCount = {
            num: 0
        };
        var d = domain.create();
        d.sumanAllHook = true;
        d.sumanAllHookName = aBeforeOrAfter.desc || '(unknown all-hook name)';
        var fini = make_fini_callbacks_1.makeAllHookCallback(d, assertCount, aBeforeOrAfter, timerObj, gracefulExit, cb);
        var fnStr = aBeforeOrAfter.fn.toString();
        if (suman.config.retriesEnabled === true && Number.isInteger(aBeforeOrAfter.retries)) {
            fini.retryFn = retryData ? retryData.retryFn : handleBeforesAndAfters.bind.apply(handleBeforesAndAfters, [null].concat(Array.from(arguments)));
        }
        var dError = false;
        var handleError = function (err) {
            if (aBeforeOrAfter.dynamicallySkipped === true) {
                return fini(null);
            }
            if (fini.retryFn) {
                if (!retryData) {
                    return fini.retryFn({ retryFn: fini.retryFn, retryCount: 1, maxRetries: aBeforeOrAfter.retries });
                }
                else if (retryData.retryCount < aBeforeOrAfter.retries) {
                    retryData.retryCount++;
                    return fini.retryFn(retryData);
                }
                else {
                    _suman.log.error('maximum retries attempted.');
                }
            }
            var errMessage = err && (err.stack || err.message || util.inspect(err));
            err = general_1.cloneError(aBeforeOrAfter.warningErr, errMessage, false);
            var stk = err.stack || err;
            var formatedStk = typeof stk === 'string' ? stk : util.inspect(stk);
            if (!dError) {
                dError = true;
                clearTimeout(timerObj.timer);
                if (aBeforeOrAfter.fatal === false) {
                    _suman.writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
                        'is set to false => \n' + formatedStk);
                    fini(null);
                }
                else {
                    gracefulExit({
                        sumanFatal: true,
                        sumanExitCode: constants.EXIT_CODES.FATAL_HOOK_ERROR,
                        stack: 'Fatal error in hook => (to continue even in the event of an error ' +
                            'in a hook use option {fatal:false}) => ' + '\n' + formatedStk
                    });
                }
            }
            else {
                _suman.writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
            }
        };
        d.on('error', handleError);
        process.nextTick(function () {
            var sumanOpts = _suman.sumanOpts;
            if (sumanOpts.debug_hooks) {
                _suman.log.info("now running all hook with name '" + chalk.yellow(aBeforeOrAfter.desc) + "'.");
            }
            d.run(function runAllHook() {
                _suman.activeDomain = d;
                var warn = false;
                if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
                    warn = true;
                }
                var h = new all_hook_param_1.AllHookParam(aBeforeOrAfter, assertCount, handleError, fini, timerObj, onTimeout);
                h.__shared = self.shared;
                h.supply = self.supply;
                h.desc = aBeforeOrAfter.desc;
                fini.thot = h;
                if (suman_utils_1.default.isGeneratorFn(aBeforeOrAfter.fn)) {
                    var handle = helpers.handleReturnVal(h.handlePossibleError.bind(h), fnStr, aBeforeOrAfter);
                    handle(helpers.handleGenerator(aBeforeOrAfter.fn, h));
                }
                else if (aBeforeOrAfter.cb) {
                    h.callbackMode = true;
                    var dne = function (err) {
                        h.callbackMode ? h.handlePossibleError(err) : h.handleNonCallbackMode(err);
                    };
                    h.done = dne;
                    var arg = Object.setPrototypeOf(dne, h);
                    if (aBeforeOrAfter.fn.call(null, arg)) {
                        _suman.writeTestError(general_1.cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handle = helpers.handleReturnVal(h.handlePossibleError.bind(h), fnStr, aBeforeOrAfter);
                    handle(aBeforeOrAfter.fn.call(null, h), warn);
                }
            });
        });
    };
};
