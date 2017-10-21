'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var constants = require('../../config/suman-constants').constants;
var handleSetupComplete = require('../handle-setup-complete').handleSetupComplete;
var general_1 = require("../helpers/general");
var general_2 = require("../helpers/general");
var typeName = 'it';
var acceptableOptions = {
    plan: true,
    throws: true,
    fatal: true,
    cb: true,
    val: true,
    value: true,
    parallel: true,
    series: true,
    mode: true,
    timeout: true,
    only: true,
    skip: true,
    events: true,
    successEvents: true,
    errorEvents: true,
    __preParsed: true
};
var handleBadOptions = function (opts) {
    Object.keys(opts).forEach(function (k) {
        if (!acceptableOptions[k]) {
            var url = constants.SUMAN_TYPES_ROOT_URL + "/" + typeName + ".d.ts";
            throw new Error("'" + k + "' is not a valid option property for an " + typeName + " hook. See: " + url);
        }
    });
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
var id = 1;
var incr = function () {
    return id++;
};
exports.makeIt = function (suman) {
    return function ($desc, $opts) {
        var sumanOpts = suman.opts, zuite = suman.ctx;
        handleSetupComplete(zuite, 'it');
        var args = pragmatik.parse(arguments, rules.testCaseSignature, {
            preParsed: suman_utils_1.default.isObject($opts) ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) { }
        var vetted = general_1.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            general_2.evalOptions(arrayDeps, opts);
        }
        if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
            console.error(' => Suman usage error => "plan" option is not an integer.');
            process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
            return;
        }
        if (opts.hasOwnProperty('parallel')) {
            if (opts.hasOwnProperty('mode')) {
                _suman.logWarning('warning => Used both parallel and mode options => mode will take precedence.');
                if (opts.mode !== 'parallel' && opts.mode !== 'series' && opts.mode !== 'serial') {
                    _suman.logWarning('warning => valid "môde" options are only values of "parallel" or "series" or "serial"' +
                        ' => ("serial" is an alias to "series").');
                }
            }
        }
        var inc = incr();
        if (opts.skip && !sumanOpts.force && !sumanOpts.allow_skip) {
            throw new Error('Test block was declared as "skipped" but "--allow-skip" option not specified.');
        }
        if (opts.only && !sumanOpts.force && !sumanOpts.allow_only) {
            throw new Error('Test block was declared as "only" but "--allow-only" option not specified.');
        }
        if (opts.skip || opts.skipped) {
            zuite.getTests().push({ testId: inc, desc: desc, skipped: true });
            return zuite;
        }
        if (!fn) {
            zuite.getTests().push({ testId: inc, desc: desc, stubbed: true });
            return zuite;
        }
        if (suman.itOnlyIsTriggered && !opts.only) {
            zuite.getTests().push({ testId: inc, desc: desc, skipped: true, skippedDueToItOnly: true });
            return zuite;
        }
        if (opts.only) {
            suman.itOnlyIsTriggered = true;
        }
        var isSeries = zuite.series || opts.series === true || opts.parallel === false;
        var isFixedParallel = !isSeries && (zuite.parallel || opts.parallel === true || opts.mode === 'parallel');
        var isParallel = (sumanOpts.parallel || sumanOpts.parallel_max) || (!sumanOpts.series && isFixedParallel);
        var isOverallParallel = (opts.fixed && isFixedParallel) || isParallel;
        var testData = {
            alreadyInitiated: false,
            testId: inc,
            stubbed: false,
            data: {},
            planCountExpected: opts.plan,
            originalOpts: opts,
            only: opts.only,
            skip: opts.skip,
            value: opts.value,
            throws: opts.throws,
            successEvents: opts.successEvents,
            errorEvents: opts.errorEvents,
            events: opts.events,
            fixed: opts.fixed,
            parallel: isOverallParallel,
            mode: opts.mode,
            delay: opts.delay,
            cb: opts.cb,
            type: 'it/test-case',
            timeout: opts.timeout || 20000,
            desc: desc || fn.name || '(unknown test case name)',
            fn: fn,
            warningErr: new Error('SUMAN_TEMP_WARNING_ERROR'),
            timedOut: false,
            complete: false,
            error: null
        };
        if (isOverallParallel) {
            zuite.getParallelTests().push(testData);
        }
        else {
            zuite.getTests().push(testData);
        }
        return zuite;
    };
};
