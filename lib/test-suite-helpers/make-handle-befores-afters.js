'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var assert = require("assert");
var util = require("util");
var _suman = global.__suman = (global.__suman || {});
var suman_utils_1 = require("suman-utils");
var chalk = require("chalk");
var handle_callback_helper_1 = require("./handle-callback-helper");
var helpers = require('./handle-promise-generator');
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var t_proto_hook_1 = require("./t-proto-hook");
var freeze_existing_props_1 = require("freeze-existing-props");
exports.makeHandleBeforesAndAfters = function (suman, gracefulExit) {
    return function handleBeforesAndAfters(self, aBeforeOrAfter, cb, retryData) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.log.error("runtime error => \"UncaughtException:Triggered\" => halting program in file:\n[" + __filename + "]");
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
        var fini = handle_callback_helper_1.makeCallback(d, assertCount, null, aBeforeOrAfter, timerObj, gracefulExit, cb);
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
            err = err || new Error('unknown hook error.');
            if (typeof err === 'string') {
                err = new Error(err);
            }
            var stk = err.stack || err;
            var stck = typeof stk === 'string' ? stk : util.inspect(stk);
            var formatedStk = String(stck).split('\n').map(function (item) { return '\t' + item; }).join('\n');
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
                        stack: '\t=> Fatal error in hook => (to continue even in the event of an error ' +
                            'in a hook use option {fatal:false}) => ' + '\n' + formatedStk
                    });
                }
            }
            else {
                _suman.writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
            }
        };
        var handlePossibleError = function (err) {
            err ? handleError(err) : fini(null);
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
                var isGeneratorFn = suman_utils_1.default.isGeneratorFn(aBeforeOrAfter.fn);
                var timeout = function (val) {
                    clearTimeout(timerObj.timer);
                    assert(val && Number.isInteger(val), 'value passed to timeout() must be an integer.');
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
                };
                var handleNonCallbackMode = function (err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                };
                var t = t_proto_hook_1.makeHookObj(aBeforeOrAfter, assertCount, handleError, handlePossibleError);
                t.shared = self.shared;
                t.$inject = self.$inject;
                t.desc = aBeforeOrAfter.desc;
                fini.th = t;
                t.timeout = timeout;
                t.fatal = function fatal(err) {
                    err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
                    fini(err, null);
                };
                var arg;
                if (isGeneratorFn) {
                    var handle = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfter);
                    arg = [freeze_existing_props_1.freezeExistingProps(t)];
                    handle(helpers.handleGenerator(aBeforeOrAfter.fn, arg));
                }
                else if (aBeforeOrAfter.cb) {
                    t.callbackMode = true;
                    var dne = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            handlePossibleError(err);
                        }
                    };
                    t.done = dne;
                    t.ctn = t.pass = function ctn(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(null);
                        }
                    };
                    arg = Object.setPrototypeOf(dne, freeze_existing_props_1.freezeExistingProps(t));
                    if (aBeforeOrAfter.fn.call(null, arg)) {
                        _suman.writeTestError(general_1.cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handle = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfter);
                    arg = freeze_existing_props_1.freezeExistingProps(t);
                    handle(aBeforeOrAfter.fn.call(null, arg), warn);
                }
            });
        });
    };
};
