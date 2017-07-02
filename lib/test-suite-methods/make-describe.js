'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require('async');
var colors = require('colors/safe');
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var suman_constants_1 = require("../../config/suman-constants");
var acquire_ioc_deps_1 = require("../acquire-dependencies/acquire-ioc-deps");
var handleSetupComplete = require('../handle-setup-complete');
var make_block_injector_1 = require("../injection/make-block-injector");
var handle_injections_1 = require("../test-suite-helpers/handle-injections");
var parse_pragmatik_args_1 = require("../helpers/parse-pragmatik-args");
var eval_options_1 = require("../helpers/eval-options");
function handleBadOptions(opts) {
    return;
}
exports.makeDescribe = function (suman, gracefulExit, TestSuiteMaker, zuite, notifyParentThatChildIsComplete) {
    var blockInjector = make_block_injector_1.makeBlockInjector(suman);
    var allDescribeBlocks = suman.allDescribeBlocks;
    return function ($$desc, $opts) {
        handleSetupComplete(zuite, 'describe');
        var args = pragmatik.parse(arguments, rules.blockSignature, {
            preParsed: suman_utils_1.default.isObject($opts) ? $opts.__preParsed : null
        });
        var vetted = parse_pragmatik_args_1.default(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], cb = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            eval_options_1.default(arrayDeps, opts);
        }
        var isGenerator = suman_utils_1.default.isGeneratorFn(cb);
        var isAsync = suman_utils_1.default.isAsyncFn(cb);
        if (isGenerator || isAsync) {
            var msg = suman_constants_1.constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            console.log('\n\n' + msg + '\n\n');
            console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
            process.exit(suman_constants_1.constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
            return;
        }
        if (zuite.parallel && opts.parallel === false) {
            console.log('\n => Suman warning => parent block ("' + zuite.desc + '") is parallel, ' +
                'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
            console.log('\n => Suman warning => To see more info on this, visit: sumanjs.org\n\n');
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
        suite.parent = zuite;
        zuite.getChildren().push(suite);
        allDescribeBlocks.push(suite);
        var deps = fnArgs(cb);
        var suiteProto = Object.getPrototypeOf(suite);
        suiteProto._run = function run(val, callback) {
            if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
                console.error(' => Now entering dubious routine in Suman lib.');
                if (zuite.parent) {
                    notifyParentThatChildIsComplete(zuite.parent.testId, zuite.testId, callback);
                }
                return;
            }
            var d = domain.create();
            d.once('error', function (err) {
                console.error('\n');
                _suman.logError('Error executing test block => \n', err.stack || err);
                err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
                gracefulExit(err);
            });
            d.run(function () {
                suite.getResumeValue = function () {
                    return val;
                };
                suite.__bindExtras();
                acquire_ioc_deps_1.default(deps, suite, function (err, deps) {
                    if (err) {
                        console.log(err.stack || err);
                        process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    else {
                        process.nextTick(function () {
                            var $deps;
                            try {
                                $deps = blockInjector(suite, zuite, deps);
                            }
                            catch (err) {
                                console.error(err.stack || err);
                                return gracefulExit(err);
                            }
                            suite.fatal = function (err) {
                                err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
                                console.log(err.stack || err);
                                err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                                gracefulExit(err);
                            };
                            var delayOptionElected = !!opts.delay;
                            if (!delayOptionElected) {
                                suiteProto.__resume = function () {
                                    _suman.logWarning('usage warning => suite.resume() has become a no-op since delay option is falsy.');
                                };
                                cb.apply(suite, $deps);
                                handle_injections_1.handleInjections(suite, function (err) {
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
                                if (!suman_utils_1.default.checkForValInStr(str_1, /resume/g, 0)) {
                                    process.nextTick(function () {
                                        console.error(new Error(' => Suman usage error => delay option was elected, so suite.resume() ' +
                                            'method needs to be called to continue,' +
                                            ' but the resume method was never referenced in the needed location, so your test cases would ' +
                                            'never be invoked before timing out => \n\n' + str_1).stack);
                                        process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                                    });
                                    return;
                                }
                                var to_1 = setTimeout(function () {
                                    console.error('\n\n => Suman fatal error => delay function was not called within alloted time.');
                                    process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
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
