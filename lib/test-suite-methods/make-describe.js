'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require('domain');
var util = require('util');
var assert = require('assert');
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require('async');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants');
var sumanUtils = require('suman-utils');
var originalAcquireDeps = require('../acquire-deps-original');
var handleSetupComplete = require('../handle-setup-complete');
var makeAcquireDepsFillIn = require('../acquire-deps-fill-in');
var handleInjections = require('../handle-injections');
function handleBadOptions(opts) {
    return;
}
module.exports = function (suman, gracefulExit, TestSuiteMaker, zuite, notifyParentThatChildIsComplete) {
    var acquireDepsFillIn = makeAcquireDepsFillIn(suman);
    var allDescribeBlocks = suman.allDescribeBlocks;
    return function ($desc, $opts, $arr, $cb) {
        handleSetupComplete(zuite);
        var args = pragmatik.parse(arguments, rules.blockSignature, {
            preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
        });
        var desc = args[0], opts = args[1], arr = args[2], cb = args[3];
        handleBadOptions(opts);
        if (arr && cb) {
            throw new Error(' => Please define either an array or callback, but not both.');
        }
        var arrayDeps;
        if (arr) {
            cb = arr[arr.length - 1];
            assert.equal(typeof cb, 'function', ' => Suman usage error => ' +
                'You need to pass a function as the last argument to the array.');
            arr.splice(-1, 1);
            arrayDeps = arr.map(function (item) {
                return String(item);
            });
        }
        arrayDeps = arrayDeps || [];
        if (arrayDeps.length > 0) {
            var preVal_1 = [];
            arrayDeps.forEach(function (a) {
                if (/:/.test(a)) {
                    preVal_1.push(a);
                }
            });
            var toEval = ['(function(){return {', preVal_1.join(','), '}}()'];
            var obj = eval(toEval.join(''));
            Object.assign(opts, obj);
        }
        var allowArrowFn = _suman.sumanConfig.allowArrowFunctionsForTestBlocks;
        var isArrow = sumanUtils.isArrowFunction(cb);
        var isGenerator = sumanUtils.isGeneratorFn(cb);
        var isAsync = sumanUtils.isAsyncFn(cb);
        if ((isArrow && !allowArrowFn) || isGenerator || isAsync) {
            var msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            console.log('\n\n' + msg + '\n\n');
            console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
            process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
            return;
        }
        if (zuite.parallel && opts.parallel === false) {
            console.log('\n => Suman warning => parent block ("' + zuite.desc + '") is parallel, ' +
                'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
            console.log('\n => Suman warning => To see more info on this, visit: sumanjs.github.io\n\n');
        }
        if (zuite.skipped) {
            var msg = ' => Suman implementation warning => Child suite entered when parent was skipped.';
            console.error(msg);
            console.error(' => Please open an issue with the following stacktrace:', '\n');
            console.error(new Error(msg).stack);
        }
        if (opts.skip || zuite.skipped || (!opts.only && suman.describeOnlyIsTriggered)) {
            suman.numBlocksSkipped++;
            return;
        }
        var suite = TestSuiteMaker({
            desc: desc,
            title: desc,
            opts: opts
        });
        suite.skipped = opts.skip || zuite.skipped;
        if (!suite.only && suman.describeOnlyIsTriggered) {
            suite.skipped = suite.skippedDueToDescribeOnly = true;
        }
        suite.parent = _.pick(zuite, 'testId', 'desc', 'title', 'parallel');
        zuite.getChildren().push({ testId: suite.testId });
        allDescribeBlocks.push(suite);
        var deps = fnArgs(cb);
        var suiteProto = Object.getPrototypeOf(suite);
        suiteProto._run = function run(val, callback) {
            if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
                throw new Error(' => Suman implementation error, this code should not be reached.');
                return process.nextTick(callback);
            }
            var d = domain.create();
            d.once('error', function (err) {
                if (_suman.weAreDebugging) {
                    console.error(err.stack || err);
                }
                console.log(' => Error executing test block => ', err.stack);
                err.sumanExitCode = constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
                gracefulExit(err);
            });
            d.run(function () {
                suite.getResumeValue = function () {
                    return val;
                };
                suite.__bindExtras();
                originalAcquireDeps(deps, function (err, deps) {
                    if (err) {
                        console.log(err.stack || err);
                        process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    else {
                        process.nextTick(function () {
                            var $deps;
                            try {
                                $deps = acquireDepsFillIn(suite, zuite, deps);
                            }
                            catch (err) {
                                console.error(err.stack || err);
                                return gracefulExit(err);
                            }
                            suite.fatal = function (err) {
                                err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
                                console.log(err.stack || err);
                                err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                                gracefulExit(err);
                            };
                            var delayOptionElected = !!opts.delay;
                            if (!delayOptionElected) {
                                suiteProto.__resume = function () {
                                    console.error('\n', ' => Suman usage warning => suite.resume() has become a noop since delay option is falsy.');
                                };
                                cb.apply(suite, $deps);
                                handleInjections(suite, function (err) {
                                    if (err) {
                                        console.error(err.stack || err);
                                        gracefulExit(err);
                                    }
                                    else {
                                        d.exit();
                                        suiteProto.isSetupComplete = true;
                                        process.nextTick(function () {
                                            zuite.__bindExtras();
                                            suite.__invokeChildren(null, callback);
                                        });
                                    }
                                });
                            }
                            else {
                                suiteProto.isDelayed = true;
                                var str_1 = cb.toString();
                                if (!sumanUtils.checkForValInStr(str_1, /resume/g, 0)) {
                                    process.nextTick(function () {
                                        console.error(new Error(' => Suman usage error => delay option was elected, so suite.resume() ' +
                                            'method needs to be called to continue,' +
                                            ' but the resume method was never referenced in the needed location, so your test cases would ' +
                                            'never be invoked before timing out => \n\n' + str_1).stack);
                                        process.exit(constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                                    });
                                    return;
                                }
                                var to_1 = setTimeout(function () {
                                    console.error('\n\n => Suman fatal error => delay function was not called within alloted time.');
                                    process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                                }, 11000);
                                var callable_1 = true;
                                suiteProto.__resume = function (val) {
                                    if (callable_1) {
                                        callable_1 = false;
                                        clearTimeout(to_1);
                                        d.exit();
                                        process.nextTick(function () {
                                            suiteProto.isSetupComplete = true;
                                            zuite.__bindExtras();
                                            suite.__invokeChildren(val, callback);
                                        });
                                    }
                                    else {
                                        var w = ' => Suman usage warning => suite.resume() was called more than once.';
                                        console.error(w);
                                        _suman._writeTestError(w);
                                    }
                                };
                                cb.apply(suite, $deps);
                            }
                        });
                    }
                });
            });
        };
    };
};
