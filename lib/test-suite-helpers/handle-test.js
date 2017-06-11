'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require('domain');
var assert = require('assert');
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var sumanUtils = require('suman-utils');
var makeCallback = require('./handle-callback-helper');
var helpers = require('./handle-promise-generator');
var cloneError = require('../clone-error');
var makeTestCase = require('../t-proto-test');
var freezeExistingProps = require('../freeze-existing');
module.exports = function (suman, gracefulExit) {
    return function handleTest(self, test, cb) {
        test.alreadyInitiated = true;
        if (_suman.sumanUncaughtExceptionTriggered) {
            console.error(' => Suman runtime error => "UncaughtException:Triggered" => halting program.');
            return;
        }
        if (test.stubbed || test.skipped) {
            return process.nextTick(cb);
        }
        var onTimeout = function () {
            test.timedOut = true;
            var err = cloneError(test.warningErr, constants.warnings.TEST_CASE_TIMED_OUT_ERROR);
            err.isFromTest = true;
            fini(err, true);
        };
        var timerObj = {
            timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : test.timeout)
        };
        var d = domain.create();
        d._sumanTest = true;
        d._sumanTestName = test.desc;
        var assertCount = {
            num: 0
        };
        var fnStr = test.fn.toString();
        var fini = makeCallback(d, assertCount, test, null, timerObj, gracefulExit, cb);
        var derror = false;
        var handleError = function (err) {
            var stack = err ? (err.stack || err) : new Error('Suman placeholder error.').stack;
            if (!derror) {
                derror = true;
                fini({ stack: stack });
            }
            else {
                _suman._writeTestError(' => Suman error => Error in hook => \n' + stack);
            }
        };
        d.on('error', handleError);
        d.run(function () {
            process.nextTick(function () {
                var warn = false;
                var isAsyncAwait = false;
                if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
                    warn = true;
                }
                var isGeneratorFn = sumanUtils.isGeneratorFn(test.fn);
                function timeout(val) {
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 500000 : val);
                }
                function $throw(str) {
                    handleError(str instanceof Error ? str : new Error(str));
                }
                function handle(fn) {
                    try {
                        fn.call(self);
                    }
                    catch (e) {
                        handleError(e);
                    }
                }
                function handleNonCallbackMode(err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                }
                var TestCase = makeTestCase(test, assertCount);
                var t = new TestCase(handleError);
                fini.th = t;
                t.handleAssertions = handle;
                t.throw = $throw;
                t.timeout = timeout;
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
                    if (test.cb === true) {
                        throw new Error('Generator function callback is also asking for callback mode => inconsistent.');
                    }
                    args = [freezeExistingProps(t)];
                    handleGenerator(test.fn, args, self);
                }
                else if (test.cb === true) {
                    t.callbackMode = true;
                    var d_1 = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err);
                        }
                    };
                    fini.th = d_1;
                    t.done = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err);
                        }
                    };
                    t.pass = function pass() {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(undefined);
                        }
                        else {
                            fini();
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
                    args = Object.setPrototypeOf(d_1, freezeExistingProps(t));
                    if (test.fn.call(self, args)) {
                        _suman._writeTestError(cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
                    args = freezeExistingProps(t);
                    handlePotentialPromise(test.fn.call(self, args), warn);
                }
            });
        });
    };
};
