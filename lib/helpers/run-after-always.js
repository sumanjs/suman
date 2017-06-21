'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var async = require("async");
var suman_utils_1 = require("suman-utils");
var helpers = require('../test-suite-helpers/handle-promise-generator');
var cloneError = require('../clone-error');
var makeHookObj = require("../t-proto-hook");
var freezeExistingProps = require("../freeze-existing");
var suman_constants_1 = require("../../config/suman-constants");
var _suman = global.__suman = (global.__suman || {});
exports.runAfterAlways = function (suman, cb) {
    var allDescribeBlocks = suman.allDescribeBlocks;
    _suman.afterAlwaysEngaged = true;
    process.on('uncaughtException', function (e) {
        console.log(' => There was an uncaught exception, however, we are currently processing after.always blocks, ' +
            'so this exception will be ignored. => ', e);
    });
    process.on('unhandledRejection', function (e) {
        console.log(' => There was an unhandled rejection, however, we are currently processing after.always blocks, ' +
            'so this exception will be ignored. => ', e);
    });
    console.error(' => We are running after.always hooks. Any errors will be ignored.');
    async.eachSeries(allDescribeBlocks, function (block, cb) {
        block.mergeAfters();
        var aftersAlways = block.getAfters().filter(function (anAfter) {
            return anAfter.always;
        });
        async.eachSeries(aftersAlways, function (anAfter, cb) {
            var timerObj = {
                timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : anAfter.timeout)
            };
            var assertCount = {
                num: 0
            };
            var d = domain.create();
            d._sumanBeforeOrAfter = true;
            d._sumanBeforeOrAfterDesc = anAfter.desc || '(unknown)';
            var fini = function (err, someBool) {
                if (err) {
                    console.error(' Error (ignored) => ', err.stack || err);
                }
                clearTimeout(timerObj.timer);
                process.nextTick(cb);
            };
            var dError = false;
            var handleError = function (err) {
                var stk = err ? (err.stack || err) : new Error('Suman error placeholder').stack;
                var formatedStk = String(stk).split('\n').map(function (item) { return '\t' + item; }).join('\n');
                if (!dError) {
                    dError = true;
                    _suman._writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
                        'is set to false => \n' + formatedStk);
                    fini(err, false);
                }
                else {
                    _suman._writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
                }
            };
            d.on('error', handleError);
            var fnStr = anAfter.fn.toString();
            function onTimeout() {
                fini(cloneError(anAfter.warningErr, suman_constants_1.constants.warnings.HOOK_TIMED_OUT_ERROR), true);
            }
            d.run(function () {
                var warn = false;
                if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
                    warn = true;
                }
                var isGeneratorFn = suman_utils_1.default.isGeneratorFn(anAfter.fn);
                function timeout(val) {
                    clearTimeout(timerObj.timer);
                    timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
                }
                function handleNonCallbackMode(err) {
                    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
                    handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
                }
                var HookObj = makeHookObj(anAfter, assertCount);
                var t = new HookObj(handleError);
                fini.th = t;
                t.timeout = timeout;
                t.fatal = function fatal(err) {
                    err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
                    fini(err, false);
                };
                var arg;
                if (isGeneratorFn) {
                    if (anAfter.cb) {
                        throw new Error('Generator function callback also asking for done param => inconsistent.');
                    }
                    var handleGenerator = helpers.makeHandleGenerator(fini);
                    arg = [freezeExistingProps(t)];
                    handleGenerator(anAfter.fn, arg, anAfter.ctx);
                }
                else if (anAfter.cb) {
                    t.callbackMode = true;
                    var d_1 = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err, false);
                        }
                    };
                    t.done = function done(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(err, false);
                        }
                    };
                    t.ctn = function ctn(err) {
                        if (!t.callbackMode) {
                            handleNonCallbackMode(err);
                        }
                        else {
                            fini(null, false);
                        }
                    };
                    arg = Object.setPrototypeOf(d_1, freezeExistingProps(t));
                    if (anAfter.fn.call(anAfter.ctx, arg)) {
                        _suman._writeTestError(cloneError(anAfter.warningErr, suman_constants_1.constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    var handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
                    arg = freezeExistingProps(t);
                    handlePotentialPromise(anAfter.fn.call(anAfter.ctx, arg), warn);
                }
            });
        }, cb);
    }, cb);
};
