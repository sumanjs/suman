'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants').constants;
var incrementer_1 = require("../misc/incrementer");
var handleSetupComplete = require('../handle-setup-complete');
var parse_pragmatik_args_1 = require("../helpers/parse-pragmatik-args");
var eval_options_1 = require("../helpers/eval-options");
function handleBadOptions(opts) {
}
exports.makeIt = function (suman, zuite) {
    return function ($desc, $opts) {
        handleSetupComplete(zuite, 'it');
        var args = pragmatik.parse(arguments, rules.testCaseSignature, {
            preParsed: suman_utils_1.default.isObject($opts) ? $opts.__preParsed : null
        });
        var vetted = parse_pragmatik_args_1.default(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            eval_options_1.default(arrayDeps, opts);
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
        var inc = incrementer_1.incr();
        var sumanOpts = _suman.sumanOpts;
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
        var testData = {
            testId: inc,
            stubbed: false,
            data: {},
            planCountExpected: opts.plan,
            originalOpts: opts,
            only: opts.only,
            skip: opts.skip,
            value: opts.value,
            throws: opts.throws,
            parallel: (!sumanOpts.series && (opts.parallel === true || opts.mode === 'parallel')),
            mode: opts.mode,
            delay: opts.delay,
            cb: opts.cb,
            type: 'it-standard',
            timeout: opts.timeout || 20000,
            desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
            fn: fn,
            warningErr: new Error('SUMAN_TEMP_WARNING_ERROR'),
            timedOut: false,
            complete: false,
            error: null
        };
        if (sumanOpts.parallel || (!sumanOpts.series && (opts.parallel || (zuite.parallel && opts.parallel !== false)))) {
            zuite.getParallelTests().push(testData);
        }
        else {
            zuite.getTests().push(testData);
        }
        return zuite;
    };
};
