'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var domain = require("domain");
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var su = require("suman-utils");
var McProxy = require("proxy-mcproxy");
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var suman_constants_1 = require("../../config/suman-constants");
var acquire_ioc_deps_1 = require("../acquire-dependencies/acquire-ioc-deps");
var general_1 = require("../helpers/general");
var handle_injections_1 = require("../test-suite-helpers/handle-injections");
var general_2 = require("../helpers/general");
var general_3 = require("../helpers/general");
var typeName = 'describe';
var acceptableOptions = {
    '@DefineObjectOpts': true,
    skip: true,
    only: true,
    __toBeSourcedForIOC: true,
    delay: true,
    desc: true,
    title: true,
    parallel: true,
    retries: true,
    limit: true,
    series: true,
    mode: true,
    __preParsed: true
};
var handleBadOptions = function (opts, typeName) {
    Object.keys(opts).forEach(function (k) {
        if (!acceptableOptions[k]) {
            var url = suman_constants_1.constants.SUMAN_TYPES_ROOT_URL + "/" + typeName + ".d.ts";
            throw new Error("'" + k + "' is not a valid option property for " + typeName + " hooks. See: " + url);
        }
    });
};
exports.makeDescribe = function (suman, gracefulExit, TestBlock, notifyParentThatChildIsComplete, blockInjector) {
    return function describe($$desc, $opts) {
        var sumanOpts = suman.opts, zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, describe.name);
        var isPreParsed = su.isObject($opts) && $opts.__preParsed;
        var args = pragmatik.parse(arguments, rules.blockSignature, isPreParsed);
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        var vetted = general_2.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], cb = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts, describe.name);
        var iocDepNames;
        if (arrayDeps.length > 0) {
            iocDepNames = general_3.evalOptions(arrayDeps, opts);
        }
        else {
            iocDepNames = [];
        }
        if (opts.__toBeSourcedForIOC) {
            Object.keys(opts.__toBeSourcedForIOC).forEach(function (v) {
                iocDepNames.push(v);
            });
        }
        if (su.isObject(opts.inject)) {
            Object.keys(opts.inject).forEach(function (v) {
                iocDepNames.push(v);
            });
        }
        if (Array.isArray(opts.inject)) {
            opts.inject.forEach(function (v) {
                iocDepNames.push(v);
            });
        }
        var allDescribeBlocks = suman.allDescribeBlocks;
        if (su.isGeneratorFn(cb) || su.isAsyncFn(cb)) {
            var msg = suman_constants_1.constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            console.error('\n');
            _suman.log.error(msg);
            _suman.log.error(new Error('Suman usage error => invalid generator/async/await function usage.').stack);
            return process.exit(suman_constants_1.constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
        }
        if (zuite.parallel && opts.parallel === false) {
            console.error('\n');
            _suman.log.warning('warning => parent block ("' + zuite.desc + '") is parallel, ' +
                'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
            _suman.log.warning('\nTo see more info on this, visit: sumanjs.org.\n');
        }
        if (zuite.skipped) {
            var msg = 'Suman implementation warning => Child block entered when parent was skipped.';
            _suman.log.error(msg);
            _suman.log.error(' => Please open an issue with the following stacktrace:', '\n');
            _suman.log.error(new Error(msg).stack);
            console.log('\n');
        }
        if (!sumanOpts.force && !_suman.inBrowser) {
            if (opts.skip && !sumanOpts.allow_skip && !sumanOpts.$allowSkip) {
                throw new Error('Test block was declared as "skipped" but "--allow-skip" / "--force" option not specified.');
            }
            if (opts.only && !sumanOpts.allow_only && !sumanOpts.$allowOnly) {
                throw new Error('Test block was declared as "only" but "--allow-only" / "--force" option not specified.');
            }
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
        if (typeof cb !== 'function') {
            throw new Error('Usage error: The following value was expected to be a function but is not => ' + util.inspect(cb));
        }
        var deps = fnArgs(cb);
        suite.bIsFirstArg = deps[0] === 'b';
        if (suite.parent.bIsFirstArg) {
            assert(suite.bIsFirstArg, 'First argument name for describe/context block callbacks must be "b" (for "block").');
        }
        suite._run = function (val, callback) {
            if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
                notifyParentThatChildIsComplete(zuite, callback);
                return;
            }
            var d = domain.create();
            d.once('error', function (err) {
                console.error('\n');
                if (!err || typeof err !== 'object') {
                    err = new Error(err ? (typeof err === 'string' ? err : util.inspect(err)) : 'unknown error passed to handler');
                }
                _suman.log.error('Error registering test block =>', err.stack || err);
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
                var v = suite.__supply = Object.create(zuite.__supply);
                suite.supply = McProxy.create(v);
                var iocDepsParent = Object.create(zuite.ioc);
                acquire_ioc_deps_1.acquireIocDeps(suman, iocDepNames, suite, iocDepsParent, function (err, iocDeps) {
                    if (err) {
                        _suman.log.error(err.stack || err);
                        return process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    suite.ioc = iocDeps;
                    process.nextTick(function () {
                        var $deps;
                        try {
                            $deps = blockInjector(suite, zuite, deps);
                        }
                        catch (err) {
                            return gracefulExit(err);
                        }
                        suite.fatal = function (err) {
                            err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
                            _suman.log.error(err.stack || err);
                            err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                            gracefulExit(err);
                        };
                        var delayOptionElected = !!opts.delay;
                        if (!delayOptionElected) {
                            suite.__resume = function () {
                                _suman.log.warning('usage warning => suite.resume() has become a no-op since delay option is falsy.');
                            };
                            cb.apply(null, $deps);
                            handle_injections_1.handleInjections(suite, function (err) {
                                if (err) {
                                    return gracefulExit(err);
                                }
                                d.exit();
                                suite.isSetupComplete = true;
                                process.nextTick(function () {
                                    zuite.bindExtras();
                                    suite.invokeChildren(null, callback);
                                });
                            });
                        }
                        else {
                            suite.isDelayed = true;
                            var to_1 = setTimeout(function () {
                                _suman.log.error('Suman fatal error => delay function was not called within alloted time.');
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
                                    var w = 'Suman usage warning => suite.resume() was called more than once.';
                                    _suman.log.error(w);
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
