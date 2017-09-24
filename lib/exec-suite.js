'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var path = require("path");
var assert = require("assert");
var vamoot_1 = require("vamoot");
var chalk = require("chalk");
var async = require("async");
var _ = require('underscore');
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var rules = require("./helpers/handle-varargs");
var suman_constants_1 = require("../config/suman-constants");
var suman_utils_1 = require("suman-utils");
var make_graceful_exit_1 = require("./make-graceful-exit");
var acquire_ioc_deps_1 = require("./acquire-dependencies/acquire-ioc-deps");
var make_block_injector_1 = require("./injection/make-block-injector");
var injection_container_1 = require("./injection/injection-container");
var make_test_suite_1 = require("./test-suite-helpers/make-test-suite");
var fatalRequestReply = require('./helpers/fatal-request-reply').fatalRequestReply;
var handle_injections_1 = require("./test-suite-helpers/handle-injections");
var on_suman_completed_1 = require("./helpers/on-suman-completed");
var eval_options_1 = require("./helpers/eval-options");
var parse_pragmatik_args_1 = require("./helpers/parse-pragmatik-args");
exports.execSuite = function (suman) {
    _suman.whichSuman = suman;
    suman.dateSuiteStarted = Date.now();
    var onSumanCompleted = on_suman_completed_1.makeOnSumanCompleted(suman);
    var container = injection_container_1.makeInjectionContainer(suman);
    var blockInjector = make_block_injector_1.makeBlockInjector(suman, container);
    var allDescribeBlocks = suman.allDescribeBlocks;
    var gracefulExit = make_graceful_exit_1.makeGracefulExit(suman);
    var mTestSuite = make_test_suite_1.makeTestSuiteMaker(suman, gracefulExit, blockInjector);
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
        var isGenerator = suman_utils_1.default.isGeneratorFn(cb);
        var isAsync = suman_utils_1.default.isAsyncFn(cb);
        if (isGenerator || isAsync) {
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
            _suman.writeTestError(' => Suite with description => "' + desc + '" was skipped because another test suite in this file\n' +
                'invoked the only option.');
            onSumanCompleted(0, ' => skipped due to "only" option invoked on another test suite');
            return;
        }
        if (opts.skip) {
            _suman.writeTestError(' => Suite with description => "' + desc + '" was skipped because because you\n' +
                'passed the "skip" option to the test suite.');
            onSumanCompleted(0, ' => skipped due to explicit call of "skip" option');
            return;
        }
        var suite = mTestSuite({ desc: desc, isTopLevel: true, opts: opts });
        suite.isRootSuite = true;
        suite.__bindExtras();
        allDescribeBlocks.push(suite);
        try {
            var globalHooks = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.hooks.js'));
            assert(typeof globalHooks === 'function', 'suman.hooks.js must export a function.');
            globalHooks.call(null, suite);
        }
        catch (err) {
            _suman.logError(chalk.magenta('warning => Could not find the "suman.hooks.js" ' +
                'file in your <suman-helpers-dir>.\n Create the file to remove the warning.'), '\n\n');
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
                _suman.writeTestError(err.stack || err);
                d_1.exit();
                process.nextTick(function () {
                    err = new Error('Suman usage error => Error acquiring IOC deps => \n' + (err.stack || err));
                    err.sumanFatal = true;
                    err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.IOC_DEPS_ACQUISITION_ERROR;
                    _suman.logError(err.stack || err);
                    gracefulExit(err, null);
                });
            });
            d_1.run(function acquireIocDepsDomainRun() {
                acquire_ioc_deps_1.acquireIocDeps(suman, deps, suite, function (err, depz) {
                    if (err) {
                        _suman.logError('error acquiring IoC deps:', err.stack || err);
                        return process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    var $deps = blockInjector(suite, null, depz);
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
            Object.defineProperty(suite, 'shared', { value: new vamoot_1.VamootProxy(), writable: false });
            d.run(function () {
                suite.fatal = function (err) {
                    process.nextTick(gracefulExit, {
                        message: 'Fatal error experienced in root suite => ' + (err.message || err),
                        stack: err.stack || err,
                        sumanExitCode: suman_constants_1.constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION
                    });
                };
                if (delayOptionElected) {
                    Object.getPrototypeOf(suite).isDelayed = true;
                    var to_1 = setTimeout(function () {
                        console.log('\n\n => Suman fatal error => suite.resume() function was not called within alloted time.');
                        process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                    }, _suman.weAreDebugging ? 5000000 : 11000);
                    if (_suman.sumanOpts.verbosity > 8) {
                        console.log(' => Waiting for delay() function to be called...');
                    }
                    var callable_1 = true;
                    Object.getPrototypeOf(suite).__resume = function (val) {
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
                            _suman.logError('Suman usage warning => suite.resume() was called more than once.');
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
                    Object.getPrototypeOf(suite).__resume = function () {
                        _suman.logWarning('usage warning => suite.resume() has become a noop since delay option is falsy.');
                    };
                    cb.apply(suite, deps);
                    Object.getPrototypeOf(suite).isSetupComplete = true;
                    handle_injections_1.handleInjections(suite, function (err) {
                        if (err) {
                            _suman.logError(err.stack || err);
                            gracefulExit(err, null);
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
        var start = function () {
            _suman.suiteResultEmitter.emit('suman-test-registered', function () {
                var sumanOpts = _suman.sumanOpts;
                _suman.currentPaddingCount = _suman.currentPaddingCount || {};
                _suman.currentPaddingCount.val = 1;
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
                    assert(Number.isInteger(limit) && limit > 0 && limit < 100, 'limit must be an integer between 1 and 100, inclusive.');
                    suite.__startSuite(function (err, results) {
                        results && _suman.logError('results => ', results);
                        err && _suman.logError('Test error data before log:', suite);
                        var children = suite.getChildren().filter(function (child) {
                            return !child.skipped;
                        });
                        if (children.length < 1) {
                            process.nextTick(cb);
                        }
                        else {
                            sumanOpts.series && (_suman.currentPaddingCount.val += 3);
                            fn(children, limit, function (child, cb) {
                                runSuite(child, cb);
                            }, function (err) {
                                sumanOpts.series && (_suman.currentPaddingCount.val -= 3);
                                err && _suman.logError('Suman implementation error => ', err.stack || err);
                                process.nextTick(cb);
                            });
                        }
                    });
                }
                runSuite(allDescribeBlocks[0], function complete() {
                    suman.dateSuiteFinished = Date.now();
                    if (_suman.sumanUncaughtExceptionTriggered) {
                        _suman.logError("\"UncaughtException\" event => halting program.\n[" + __filename + "]");
                        return;
                    }
                    onSumanCompleted(0, null);
                });
            });
        };
    };
};
