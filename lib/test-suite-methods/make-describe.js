'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var domain = require("domain");
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var suman_constants_1 = require("../../config/suman-constants");
var acquire_ioc_deps_1 = require("../acquire-dependencies/acquire-ioc-deps");
var handleSetupComplete = require('../handle-setup-complete').handleSetupComplete;
var handle_injections_1 = require("../test-suite-helpers/handle-injections");
var parse_pragmatik_args_1 = require("../helpers/parse-pragmatik-args");
var eval_options_1 = require("../helpers/eval-options");
var typeName = 'describe';
var acceptableOptions = {
    skip: true,
    only: true,
    delay: true,
    parallel: true,
    limit: true,
    series: true,
    mode: true,
    __preParsed: true
};
var handleBadOptions = function (opts) {
    Object.keys(opts).forEach(function (k) {
        if (!acceptableOptions[k]) {
            var url = suman_constants_1.constants.SUMAN_TYPES_ROOT_URL + "/" + typeName + ".d.ts";
            throw new Error("'" + k + "' is not a valid option property for " + typeName + " hooks. See: " + url);
        }
    });
};
exports.makeDescribe = function (suman, gracefulExit, TestBlock, notifyParentThatChildIsComplete, blockInjector) {
    return function ($$desc, $opts) {
        var sumanOpts = suman.opts, zuite = suman.ctx;
        handleSetupComplete(zuite, 'describe');
        var args = pragmatik.parse(arguments, rules.blockSignature, {
            preParsed: su.isObject($opts) ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) { }
        var vetted = parse_pragmatik_args_1.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], cb = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            eval_options_1.evalOptions(arrayDeps, opts);
        }
        var allDescribeBlocks = suman.allDescribeBlocks;
        var isGenerator = su.isGeneratorFn(cb);
        var isAsync = su.isAsyncFn(cb);
        if (isGenerator || isAsync) {
            var msg = suman_constants_1.constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            console.log('\n\n' + msg + '\n\n');
            console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
            process.exit(suman_constants_1.constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
            return;
        }
        if (zuite.parallel && opts.parallel === false) {
            console.error('\n');
            _suman.logWarning('warning => parent block ("' + zuite.desc + '") is parallel, ' +
                'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
            _suman.logWarning('\nTo see more info on this, visit: sumanjs.org.\n');
        }
        if (zuite.skipped) {
            var msg = 'Suman implementation warning => Child block entered when parent was skipped.';
            console.error(msg);
            console.error(' => Please open an issue with the following stacktrace:', '\n');
            console.error(new Error(msg).stack);
            console.log('\n');
        }
        if (opts.skip && !sumanOpts.force && !sumanOpts.allow_skip) {
            throw new Error('Test block was declared as "skipped" but "--allow-skip" option not specified.');
        }
        if (opts.only && !sumanOpts.force && !sumanOpts.allow_only) {
            throw new Error('Test block was declared as "only" but "--allow-only" option not specified.');
        }
        if (opts.skip || zuite.skipped || (!opts.only && suman.describeOnlyIsTriggered)) {
            suman.numBlocksSkipped++;
            return;
        }
        var suite = new TestBlock({ desc: desc, title: desc, opts: opts });
        if (zuite.fixed) {
            suite.fixed = true;
        }
        suite.skipped = opts.skip || zuite.skipped;
        if (!suite.only && suman.describeOnlyIsTriggered) {
            suite.skipped = suite.skippedDueToDescribeOnly = true;
        }
        if (suite.only) {
            suman.describeOnlyIsTriggered = true;
        }
        Object.defineProperty(suite, 'parent', { value: zuite, writable: false });
        zuite.getChildren().push(suite);
        allDescribeBlocks.push(suite);
        var deps = fnArgs(cb);
        suite._run = function (val, callback) {
            if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
                notifyParentThatChildIsComplete(zuite, callback);
                return;
            }
            var d = domain.create();
            d.once('error', function blockRegistrationErrorHandler(err) {
                console.error('\n');
                if (!err || typeof err !== 'object') {
                    err = new Error(err ? (typeof err === 'string' ? err : util.inspect(err)) : 'unknown error passed to handler');
                }
                _suman.logError('Error registering test block =>', err.stack || err);
                err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
                gracefulExit(err);
            });
            d.run(function registerTheBlock() {
                suite.getResumeValue = function () {
                    return val;
                };
                suite.bindExtras();
                Object.defineProperty(suite, 'shared', {
                    value: zuite.shared.clone(),
                    writable: false
                });
                acquire_ioc_deps_1.acquireIocDeps(suman, deps, suite, function (err, depz) {
                    if (err) {
                        _suman.logError(err.stack || err);
                        process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                        return;
                    }
                    process.nextTick(function () {
                        var $deps;
                        try {
                            $deps = blockInjector(suite, zuite, depz);
                        }
                        catch (err) {
                            return gracefulExit(err);
                        }
                        suite.fatal = function (err) {
                            err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
                            _suman.logError(err.stack || err);
                            err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                            gracefulExit(err);
                        };
                        var delayOptionElected = !!opts.delay;
                        if (!delayOptionElected) {
                            suite.__resume = function () {
                                _suman.logWarning('usage warning => suite.resume() has become a no-op since delay option is falsy.');
                            };
                            cb.apply(null, $deps);
                            handle_injections_1.handleInjections(suite, function (err) {
                                if (err) {
                                    gracefulExit(err);
                                }
                                else {
                                    d.exit();
                                    suite.isSetupComplete = true;
                                    process.nextTick(function () {
                                        zuite.bindExtras();
                                        suite.invokeChildren(null, callback);
                                    });
                                }
                            });
                        }
                        else {
                            suite.isDelayed = true;
                            var str_1 = cb.toString();
                            if (!su.checkForValInStr(str_1, /resume/g, 0)) {
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
                            }, _suman.weAreDebugging ? 5000000 : 11000);
                            var callable_1 = true;
                            suite.__resume = function (val) {
                                if (callable_1) {
                                    callable_1 = false;
                                    clearTimeout(to_1);
                                    d.exit();
                                    process.nextTick(function () {
                                        suite.isSetupComplete = true;
                                        zuite.bindExtras();
                                        suite.invokeChildren(val, callback);
                                    });
                                }
                                else {
                                    var w = ' => Suman usage warning => suite.resume() was called more than once.';
                                    console.error(w);
                                    _suman.writeTestError(w);
                                }
                            };
                            cb.apply(null, $deps);
                        }
                    });
                });
            });
        };
    };
};
