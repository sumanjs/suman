'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var path = require("path");
var assert = require("assert");
var colors = require('colors/safe');
var async = require('async');
var _ = require('underscore');
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var debug = require('suman-debug')('s:index');
var _suman = global.__suman = (global.__suman || {});
var rules = require("./helpers/handle-varargs");
var suman_constants_1 = require("../config/suman-constants");
var suman_utils_1 = require("suman-utils");
var makeGracefulExit = require("./make-graceful-exit");
var acquire_ioc_deps_1 = require("./acquire-ioc-deps");
var acquire_deps_fill_in_1 = require("./acquire-deps-fill-in");
var makeTestSuite = require('./make-test-suite');
var fatalRequestReply = require('./helpers/fatal-request-reply').fatalRequestReply;
var handleInjections = require('./handle-injections').handleInjections;
var on_suman_completed_1 = require("./helpers/on-suman-completed");
var eval_options_1 = require("./helpers/eval-options");
var parse_pragmatik_args_1 = require("./helpers/parse-pragmatik-args");
exports.execSuite = function (suman) {
    _suman.whichSuman = suman;
    var onSumanCompleted = on_suman_completed_1.default(suman);
    var acquireDepsFillIn = acquire_deps_fill_in_1.default(suman);
    suman.dateSuiteStarted = Date.now();
    var allDescribeBlocks = suman.allDescribeBlocks;
    var gracefulExit = makeGracefulExit(suman);
    var mTestSuite = makeTestSuite(suman, gracefulExit);
    return function runRootSuite() {
        var args = pragmatik.parse(arguments, rules.createSignature);
        var vetted = parse_pragmatik_args_1.default(args);
        var _a = vetted.args, $desc = _a[0], opts = _a[1], cb = _a[2];
        var arrayDeps = vetted.arrayDeps;
        assert(opts.__preParsed, 'Suman implementation error. ' +
            'Options should be pre-parsed at this point in the program. Please report.');
        if (arrayDeps.length > 0) {
            eval_options_1.default(arrayDeps, opts);
        }
        var desc = ($desc === '[suman-placeholder]') ? suman.slicedFileName : $desc;
        suman.desc = desc;
        var allowArrowFn = _suman.sumanConfig.allowArrowFunctionsForTestBlocks;
        var isArrow = suman_utils_1.default.isArrowFunction(cb);
        var isGenerator = suman_utils_1.default.isGeneratorFn(cb);
        var isAsync = suman_utils_1.default.isAsyncFn(cb);
        if ((isArrow && !allowArrowFn) || isGenerator || isAsync) {
            var msg_1 = suman_constants_1.constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            return fatalRequestReply({
                type: suman_constants_1.constants.runner_message_type.FATAL,
                data: {
                    errors: [msg_1],
                    msg: msg_1
                }
            }, function () {
                console.log(msg_1 + '\n\n');
                console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
                process.exit(suman_constants_1.constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
            });
        }
        var deps = suman.deps = fnArgs(cb);
        var delayOptionElected = opts.delay;
        suman.rootSuiteDescription = desc;
        if (!opts.only && _suman.describeOnlyIsTriggered) {
            _suman._writeTestError(' => Suite with description => "' + desc + '" was skipped because another test suite in this file\n' +
                'invoked the only option.');
            onSumanCompleted(0, ' => skipped due to "only" option invoked on another test suite');
            return;
        }
        if (opts.skip) {
            _suman._writeTestError(' => Suite with description => "' + desc + '" was skipped because because you\n' +
                'passed the "skip" option to the test suite.');
            onSumanCompleted(0, ' => skipped due to explicit call of "skip" option');
            return;
        }
        var suite = mTestSuite({
            desc: desc,
            isTopLevel: true,
            opts: opts
        });
        suite.isRootSuite = true;
        suite.__bindExtras();
        allDescribeBlocks.push(suite);
        try {
            var globalHooks = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.hooks.js'));
            assert(typeof globalHooks === 'function', 'suman.hooks.js must export a function.');
            globalHooks.call(suite, suite);
        }
        catch (err) {
            console.error('\n' + colors.magenta(' => Suman warning => Could not find the "suman.hooks.js" ' +
                'file in your <suman-helpers-dir>.\n' +
                'Create the file to remove the warning.'), '\n\n');
            if (_suman.sumanOpts.verbosity > 3) {
                console.error('\n', err.stack || err, '\n');
            }
        }
        if (deps.length < 1) {
            process.nextTick(function () {
                startWholeShebang([]);
            });
        }
        else {
            var d_1 = domain.create();
            d_1.once('error', function (err) {
                console.error(err.stack || err);
                _suman._writeTestError(err.stack || err);
                d_1.exit();
                process.nextTick(function () {
                    err = new Error(' => Suman usage error => Error acquiring IOC deps => \n' + (err.stack || err));
                    err.sumanFatal = true;
                    err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.IOC_DEPS_ACQUISITION_ERROR;
                    console.error(err.stack || err);
                    gracefulExit(err);
                });
            });
            d_1.run(function () {
                acquire_ioc_deps_1.default(deps, suite, function (err, depz) {
                    if (err) {
                        _suman.logError('error acquiring IoC deps:', err.stack || err);
                        return process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    var $deps = acquireDepsFillIn(suite, null, depz);
                    d_1.exit();
                    process.nextTick(startWholeShebang, $deps);
                });
            });
        }
        function startWholeShebang(deps) {
            var d = domain.create();
            d.once('error', function ($err) {
                d.exit();
                process.nextTick(gracefulExit, {
                    message: $err.message || $err,
                    stack: $err.stack || $err,
                    sumanFatal: true,
                    sumanExitCode: suman_constants_1.constants.EXIT_CODES.ERROR_IN_ROOT_SUITE_BLOCK
                });
            });
            d.run(function () {
                suite.fatal = function (err) {
                    process.nextTick(gracefulExit, {
                        message: 'Fatal error experienced in root suite => ' + (err.message || err),
                        stack: err.stack || err,
                        sumanExitCode: suman_constants_1.constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION
                    });
                };
                if (delayOptionElected) {
                    suite.__proto__.isDelayed = true;
                    var to_1 = setTimeout(function () {
                        console.log('\n\n => Suman fatal error => suite.resume() function was not called within alloted time.');
                        process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                    }, _suman.weAreDebugging ? 500000 : 11000);
                    if (_suman.sumanOpts.verbosity > 8) {
                        console.log(' => Waiting for delay() function to be called...');
                    }
                    var callable_1 = true;
                    suite.__proto__.__resume = function (val) {
                        if (callable_1) {
                            callable_1 = false;
                            clearTimeout(to_1);
                            process.nextTick(function () {
                                _suman.ctx = null;
                                suite.__proto__.isSetupComplete = true;
                                suite.__invokeChildren(val, start);
                            });
                        }
                        else {
                            console.error('\n', ' => Suman usage warning => suite.resume() was called more than once.');
                        }
                    };
                    var str_1 = cb.toString();
                    if (!suman_utils_1.default.checkForValInStr(str_1, /resume/g, 0)) {
                        process.nextTick(function () {
                            console.error(new Error(' => Suman usage error => suite.resume() method needs to be called to continue,' +
                                ' but the resume method was never referenced, so your test cases would never be invoked before timing out.').stack
                                + '\n =>' + str_1);
                            process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                        });
                    }
                    else {
                        cb.apply(suite, deps);
                    }
                }
                else {
                    suite.__proto__.__resume = function () {
                        _suman.logWarning('usage warning => suite.resume() has become a noop since delay option is falsy.');
                    };
                    cb.apply(suite, deps);
                    suite.__proto__.isSetupComplete = true;
                    handleInjections(suite, function (err) {
                        if (err) {
                            console.error(err.stack || err);
                            gracefulExit(err);
                        }
                        else {
                            process.nextTick(function () {
                                suite.__invokeChildren(null, start);
                            });
                        }
                    });
                }
            });
        }
        function start() {
            function runSuite(suite, cb) {
                if (_suman.sumanUncaughtExceptionTriggered) {
                    _suman.logError("\"UncaughtException:Triggered\" => halting program.\n[" + __filename + "]");
                    return;
                }
                var fn = async.eachLimit;
                var limit = 1;
                if (suite.parallel) {
                    if (suite.limit) {
                        limit = Math.min(suite.limit, 300);
                    }
                    else {
                        limit = _suman.sumanConfig.DEFAULT_PARALLEL_BLOCK_LIMIT || suman_constants_1.constants.DEFAULT_PARALLEL_BLOCK_LIMIT;
                    }
                }
                suite.__startSuite(function (err, results) {
                    if (err) {
                        console.error(' => Test error data before log:', suite);
                    }
                    suman.logData(suite);
                    var children = suite.getChildren().filter(function (child) {
                        return !child.skipped;
                    });
                    if (children.length < 1) {
                        process.nextTick(cb);
                    }
                    else {
                        fn(children, limit, function (child, cb) {
                            child = _.findWhere(allDescribeBlocks, {
                                testId: child.testId
                            });
                            runSuite(child, cb);
                        }, function (err) {
                            err && console.error(' => Suman implementation error => ', err.stack || err);
                            process.nextTick(cb);
                        });
                    }
                });
            }
            runSuite(allDescribeBlocks[0], function complete() {
                suman.dateSuiteFinished = Date.now();
                if (_suman.sumanUncaughtExceptionTriggered) {
                    _suman.logError("runtime error => \"UncaughtException:Triggered\" => halting program.\n[" + __filename + "]");
                    return;
                }
                onSumanCompleted(0, null);
            });
        }
    };
};
