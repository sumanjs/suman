'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require('domain');
var assert = require('assert');
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var su = require('suman-utils');
var constants = require('../../config/suman-constants').constants;
var cloneError = require('../clone-error');
var makeHookObj = require('../t-proto-hook');
var makeCallback = require('./handle-callback-helper');
var helpers = require('./handle-promise-generator');
var freezeExistingProps = require('../freeze-existing');
module.exports = function (suman, gracefulExit) {
    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            console.error(' => Suman runtime error => uncaughtException experienced => halting program.');
            return;
        }
        aBeforeOrAfterEach.alreadyInitiated = true;
        if (test.skipped || test.stubbed) {
            return process.nextTick(cb);
        }
        var onTimeout = function () {
            var err = cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR);
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
        d._sumanEach = true;
        d._sumanEachDesc = aBeforeOrAfterEach.desc || '(unknown)';
        var fini = makeCallback(d, assertCount, null, aBeforeOrAfterEach, timerObj, gracefulExit, cb);
        var fnStr = aBeforeOrAfterEach.fn.toString();
        var dError = false;
        var handleError = function (err) {
            var stk = err.stack || err;
            var formatedStk = String(stk).split('\n').map(function (item) { return '\t' + item; }).join('\n');
            if (!dError) {
                dError = true;
                if (aBeforeOrAfterEach.fatal === false) {
                    var msg = ' => Suman non-fatal error => Error in hook and "fatal" option for the hook ' +
                        'is set to false => \n' + formatedStk;
                    console.log('\n\n', msg, '\n\n');
                    _suman._writeTestError(msg);
                    fini(null);
                }
                else {
                    err = new Error(' => fatal error in hook => (to continue even in the event of an error ' +
                        'in a hook, use option {fatal:false}) =>' + '\n\n' + formatedStk);
                    err.sumanFatal = true;
                    err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
                    gracefulExit(err);
                }
            }
            else {
                _suman._writeTestError(' => Suman error => Error in hook => \n' + stk);
            }
        };
        d.on('error', handleError);
        d.run(function () {
            process.nextTick(function () {
                var isAsyncAwait = false;
                var isGeneratorFn = su.isGeneratorFn(aBeforeOrAfterEach.fn);
                if (fnStr.indexOf('async') === 0) {
                    isAsyncAwait = true;
                }
                function timeout(val) {
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 500000 : val);
                }
                function handleNonCallbackMode(err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                }
                var HookObj = makeHookObj(aBeforeOrAfterEach, assertCount);
                var t = new HookObj(handleError);
                fini.th = t;
                t.timeout = timeout;
                t.data = test.data;
                t.desc = t.title = test.desc;
                t.value = test.value;
                t.testId = test.testId;
                t.state = 'passed';
                t.fatal = function fatal(err) {
                    if (!t.callbackMode) {
                        handleNonCallbackMode(err);
                    }
                    else {
                        err = err || new Error('Temp error since user did not provide one.');
                        err.sumanFatal = true;
                        fini(err);
                    }
                };
                var args;
                if (isGeneratorFn) {
                    if (aBeforeOrAfterEach.cb) {
                        throw new Error('Generator function callback also asking for callback param => inconsistent.');
                    }
                    var handleGenerator = helpers.makeHandleGenerator(fini);
                    args = [freezeExistingProps(t)];
                    handleGenerator(aBeforeOrAfterEach.fn, args, aBeforeOrAfterEach.ctx);
                }
                else if (aBeforeOrAfterEach.cb) {
                    t.callbackMode = true;
                    var d_1 = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            err && (err.sumanFatal = !!_suman.sumanOpts.bail);
                            fini(err);
                        }
                    };
                    t.done = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            err && (err.sumanFatal = !!_suman.sumanOpts.bail);
                            fini(err);
                        }
                    };
                    t.ctn = function ctn() {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(undefined);
                        }
                        else {
                            fini(null);
                        }
                    };
                    args = Object.setPrototypeOf(d_1, freezeExistingProps(t));
                    if (aBeforeOrAfterEach.fn.call(aBeforeOrAfterEach.ctx, args)) {
                        _suman._writeTestError(cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
                    args = freezeExistingProps(t);
                    handlePotentialPromise(aBeforeOrAfterEach.fn.call(aBeforeOrAfterEach.ctx, args), false);
                }
            });
        });
    };
};
