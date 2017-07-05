'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var _suman = global.__suman = (global.__suman || {});
var suman_utils_1 = require("suman-utils");
var handle_callback_helper_1 = require("./handle-callback-helper");
var helpers = require('./handle-promise-generator');
var constants = require('../../config/suman-constants').constants;
var clone_error_1 = require("../misc/clone-error");
var t_proto_hook_1 = require("./t-proto-hook");
var freeze_existing_props_1 = require("freeze-existing-props");
exports.makeHandleBeforesAndAfters = function (suman, gracefulExit) {
    return function handleBeforesAndAfters(aBeforeOrAfter, cb) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.logError("runtime error => \"UncaughtException:Triggered\" => halting program.\n[" + __filename + "]");
            return;
        }
        aBeforeOrAfter.alreadyInitiated = true;
        var timerObj = {
            timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfter.timeout)
        };
        var assertCount = {
            num: 0
        };
        var d = domain.create();
        d._sumanBeforeOrAfter = true;
        d._sumanBeforeOrAfterDesc = aBeforeOrAfter.desc || '(unknown)';
        var fini = handle_callback_helper_1.makeCallback(d, assertCount, null, aBeforeOrAfter, timerObj, gracefulExit, cb);
        var fnStr = aBeforeOrAfter.fn.toString();
        function onTimeout() {
            fini(clone_error_1.cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
        }
        var dError = false;
        var handleError = function (err) {
            var stk = err ? (err.stack || err) : new Error('Suman error placeholder').stack;
            var formatedStk = String(stk).split('\n').map(function (item) { return '\t' + item; }).join('\n');
            if (!dError) {
                dError = true;
                clearTimeout(timerObj.timer);
                if (aBeforeOrAfter.fatal === false) {
                    _suman._writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
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
                _suman._writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
            }
        };
        d.on('error', handleError);
        process.nextTick(function () {
            d.run(function () {
                var warn = false;
                if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
                    warn = true;
                }
                var isGeneratorFn = suman_utils_1.default.isGeneratorFn(aBeforeOrAfter.fn);
                function timeout(val) {
                    clearTimeout(timerObj.timer);
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
                }
                function handleNonCallbackMode(err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                }
                var HookObj = t_proto_hook_1.makeHookObj(aBeforeOrAfter, assertCount);
                var t = new HookObj(handleError);
                fini.th = t;
                t.timeout = timeout;
                t.fatal = function fatal(err) {
                    err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
                    fini(err);
                };
                var arg;
                if (isGeneratorFn) {
                    var handleGenerator = helpers.makeHandleGenerator(fini);
                    arg = [freeze_existing_props_1.freezeExistingProps(t)];
                    handleGenerator(aBeforeOrAfter.fn, arg, aBeforeOrAfter.ctx);
                }
                else if (aBeforeOrAfter.cb) {
                    t.callbackMode = true;
                    var d_1 = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err);
                        }
                    };
                    t.done = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err);
                        }
                    };
                    t.ctn = t.pass = function ctn(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(null);
                        }
                    };
                    arg = Object.setPrototypeOf(d_1, freeze_existing_props_1.freezeExistingProps(t));
                    if (aBeforeOrAfter.fn.call(aBeforeOrAfter.ctx, arg)) {
                        _suman._writeTestError(clone_error_1.cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
                    arg = freeze_existing_props_1.freezeExistingProps(t);
                    handlePotentialPromise(aBeforeOrAfter.fn.call(aBeforeOrAfter.ctx, arg), warn);
                }
            });
        });
    };
};
