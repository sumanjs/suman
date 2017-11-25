'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var assert = require("assert");
var vamoot_1 = require("vamoot");
var McProxy = require("proxy-mcproxy");
var chalk = require("chalk");
var async = require("async");
var _ = require('underscore');
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var rules = require("./helpers/handle-varargs");
var suman_constants_1 = require("../config/suman-constants");
var su = require("suman-utils");
var make_graceful_exit_1 = require("./make-graceful-exit");
var acquire_ioc_deps_1 = require("./acquire-dependencies/acquire-ioc-deps");
var make_test_suite_1 = require("./test-suite-helpers/make-test-suite");
var general_1 = require("./helpers/general");
var handle_injections2_1 = require("./test-suite-helpers/handle-injections2");
var general_2 = require("./helpers/general");
var general_3 = require("./helpers/general");
var general = require("./helpers/general");
var suman_methods_1 = require("./test-suite-helpers/suman-methods");
var make_handle_befores_afters_1 = require("./test-suite-helpers/make-handle-befores-afters");
var notify_parent_that_child_is_complete_1 = require("./test-suite-helpers/notify-parent-that-child-is-complete");
exports.execSuite = function (suman) {
    _suman.whichSuman = suman;
    var sumanConfig = suman.config;
    suman.dateSuiteStarted = Date.now();
    var onSumanCompleted = general_2.makeOnSumanCompleted(suman);
    var gracefulExit = make_graceful_exit_1.makeGracefulExit(suman);
    var handleBeforesAndAfters = make_handle_befores_afters_1.makeHandleBeforesAndAfters(suman, gracefulExit);
    var notifyParent = notify_parent_that_child_is_complete_1.makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);
    var TestBlock = make_test_suite_1.makeTestSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
    var createInjector = suman_methods_1.makeSumanMethods(suman, TestBlock, gracefulExit, notifyParent);
    var allDescribeBlocks = suman.allDescribeBlocks;
    return function runRootSuite($$desc, $$opts) {
        var sumanOpts = suman.opts;
        var args = pragmatik.parse(arguments, rules.createSignature, {
            preParsed: su.isObject($$opts) && $$opts.__preParsed
        });
        var vetted = general.parseArgs(args);
        var _a = vetted.args, $desc = _a[0], opts = _a[1], cb = _a[2];
        var arrayDeps = vetted.arrayDeps;
        var iocDeps;
        assert(opts.__preParsed, 'Suman implementation error. ' +
            'Options should be pre-parsed at this point in the program. Please report.');
        delete opts.__preParsed;
        if (arrayDeps && arrayDeps.length > 0) {
            iocDeps = general_3.evalOptions(arrayDeps, opts);
        }
        else {
            iocDeps = [];
        }
        if (opts.sourced) {
            Object.keys(opts.sourced).forEach(function (v) {
                iocDeps.push(v);
            });
        }
        var desc = ($desc === '[suman-placeholder]') ? suman.slicedFileName : $desc;
        suman.desc = desc;
        var isGenerator = su.isGeneratorFn(cb);
        var isAsync = su.isAsyncFn(cb);
        if (isGenerator || isAsync) {
            var msg_1 = suman_constants_1.constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            return general_1.fatalRequestReply({
                type: suman_constants_1.constants.runner_message_type.FATAL,
                data: {
                    errors: [msg_1],
                    msg: msg_1
                }
            }, function () {
                console.error(msg_1 + '\n\n');
                var err = new Error('Suman usage error => invalid arrow/generator function usage.').stack;
                _suman.log.error(err);
                _suman.writeTestError(err);
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
        var suite = new TestBlock({ desc: desc, isTopLevel: true, opts: opts });
        suite.isRootSuite = true;
        suite.bindExtras();
        allDescribeBlocks.push(suite);
        suite.__inject = {};
        suite.$inject = McProxy.create(suite.__inject);
        try {
            assert(typeof _suman.globalHooksFn === 'function', '<suman.hooks.js> file must export a function.');
            _suman.globalHooksFn.call(null, suite);
        }
        catch (err) {
            _suman.log.error(chalk.yellow('warning: Could not load your "suman.hooks.js" file'));
            if (!/Cannot find module/i.test(err.message)) {
                throw err;
            }
        }
        if (deps.length < 1) {
            process.nextTick(startWholeShebang, null, []);
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
                    _suman.log.error(err.stack || err);
                    gracefulExit(err, null);
                });
            });
            d_1.run(function acquireIocDepsDomainRun() {
                acquire_ioc_deps_1.acquireIocDeps(suman, iocDeps, suite, {}, function (err, iocDeps) {
                    if (err) {
                        _suman.log.error('Error acquiring IoC deps:', err.stack || err);
                        return process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    suite.ioc = iocDeps;
                    var mappedDeps = createInjector(suite, deps);
                    try {
                        d_1.exit();
                    }
                    finally {
                        process.nextTick(startWholeShebang, mappedDeps);
                    }
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
                    suite.isDelayed = true;
                    var to_1 = setTimeout(function () {
                        console.log('\n\n => Suman fatal error => suite.resume() function was not called within alloted time.');
                        process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                    }, _suman.weAreDebugging ? 5000000 : 11000);
                    if (sumanOpts.verbosity > 8) {
                        console.log(' => Waiting for delay() function to be called...');
                    }
                    var callable_1 = true;
                    suite.__resume = function (val) {
                        if (callable_1) {
                            callable_1 = false;
                            clearTimeout(to_1);
                            process.nextTick(function () {
                                suman.ctx = null;
                                suite.isSetupComplete = true;
                                suite.invokeChildren(val, start);
                            });
                        }
                        else {
                            _suman.log.error('Suman usage warning => suite.resume() was called more than once.');
                        }
                    };
                    var str_1 = cb.toString();
                    if (!su.checkForValInStr(str_1, /resume/g, 0)) {
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
                    suite.__resume = function () {
                        _suman.log.warning('usage warning => suite.resume() has become a noop since delay option is falsy.');
                    };
                    cb.apply(null, deps);
                    suite.isSetupComplete = true;
                    handle_injections2_1.handleInjections(suite, function (err) {
                        if (err) {
                            _suman.log.error(err.stack || err);
                            gracefulExit(err, null);
                        }
                        else {
                            process.nextTick(function () {
                                suite.invokeChildren(null, start);
                            });
                        }
                    });
                }
            });
        }
        var start = function () {
            _suman.suiteResultEmitter.emit('suman-test-registered', function () {
                var sumanOpts = suman.opts;
                var currentPaddingCount = _suman.currentPaddingCount
                    = (_suman.currentPaddingCount || {});
                currentPaddingCount.val = 1;
                var runSuite = function (suite, cb) {
                    if (_suman.sumanUncaughtExceptionTriggered) {
                        _suman.log.error("\"UncaughtException:Triggered\" => halting program.\n[" + __filename + "]");
                        return;
                    }
                    var limit = 1;
                    if (suite.parallel) {
                        if (suite.limit) {
                            limit = Math.min(suite.limit, 300);
                        }
                        else {
                            limit = sumanConfig.DEFAULT_PARALLEL_BLOCK_LIMIT || suman_constants_1.constants.DEFAULT_PARALLEL_BLOCK_LIMIT;
                        }
                    }
                    assert(Number.isInteger(limit) && limit > 0 && limit < 100, 'limit must be an integer between 1 and 100, inclusive.');
                    suite.startSuite(function (err, results) {
                        results && _suman.log.error('Suman extraneous results:', results);
                        err && _suman.log.error('Suman extraneous test error:', suite);
                        var children = suite.getChildren().filter(function (child) {
                            return !child.skipped;
                        });
                        if (children.length < 1) {
                            return process.nextTick(cb);
                        }
                        sumanOpts.series && (currentPaddingCount.val += 3);
                        async.eachLimit(children, limit, function (child, cb) {
                            runSuite(child, cb);
                        }, function (err) {
                            sumanOpts.series && (currentPaddingCount.val -= 3);
                            err && _suman.log.error('Suman implementation error:', err.stack || err);
                            process.nextTick(cb);
                        });
                    });
                };
                runSuite(allDescribeBlocks[0], function complete() {
                    suman.dateSuiteFinished = Date.now();
                    if (_suman.sumanUncaughtExceptionTriggered) {
                        _suman.log.error("\"UncaughtException\" event => halting program.\n[" + __filename + "]");
                        return;
                    }
                    if (sumanOpts.parallel_max) {
                        suman.getQueue().drain = function () {
                            onSumanCompleted(0, null);
                        };
                    }
                    else {
                        onSumanCompleted(0, null);
                    }
                });
            });
        };
    };
};
