'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require('domain');
var assert = require('assert');
var _suman = global.__suman = (global.__suman || {});
var su = require('suman-utils');
var fnArgs = require('function-arguments');
var debug_core = require('suman-debug')('suman:core');
var debugSumanTest = require('suman-debug')('suman:test');
var makeCallback = require('./handle-callback-helper');
var helpers = require('./handle-promise-generator');
var constants = require('../../config/suman-constants');
var cloneError = require('../clone-error');
var makeHookObj = require('../t-proto-hook');
var freezeExistingProps = require('../freeze-existing');
module.exports = function (suman, gracefulExit) {
    return function handleBeforesAndAfters(aBeforeOrAfter, cb) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            console.error(' => Suman runtime error => "UncaughtException:Triggered" => halting program.');
            return;
        }
        var timerObj = {
            timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfter.timeout)
        };
        var assertCount = {
            num: 0
        };
        var d = domain.create();
        d._sumanBeforeAfter = true;
        d._sumanBeforeAfterDesc = aBeforeOrAfter.desc || '(unknown)';
        var fini = makeCallback(d, assertCount, null, aBeforeOrAfter, timerObj, gracefulExit, cb);
        var fnStr = aBeforeOrAfter.fn.toString();
        function onTimeout() {
            fini(cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
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
                var isGeneratorFn = su.isGeneratorFn(aBeforeOrAfter.fn);
                function timeout(val) {
                    clearTimeout(timerObj.timer);
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
                }
                function handleNonCallbackMode(err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                }
                var HookObj = makeHookObj(aBeforeOrAfter, assertCount);
                var t = new HookObj(handleError);
                fini.th = t;
                t.timeout = timeout;
                t.fatal = function fatal(err) {
                    err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
                    fini(err);
                };
                var arg;
                if (isGeneratorFn) {
                    if (aBeforeOrAfter.cb) {
                        throw new Error('Generator function callback also asking for done param => inconsistent.');
                    }
                    var handleGenerator = helpers.makeHandleGenerator(fini);
                    arg = [freezeExistingProps(t)];
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
                    t.ctn = function ctn(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(null);
                        }
                    };
                    arg = Object.setPrototypeOf(d_1, freezeExistingProps(t));
                    if (aBeforeOrAfter.fn.call(aBeforeOrAfter.ctx, arg)) {
                        _suman._writeTestError(cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
                    arg = freezeExistingProps(t);
                    handlePotentialPromise(aBeforeOrAfter.fn.call(aBeforeOrAfter.ctx, arg), warn);
                }
            });
        });
    };
};
