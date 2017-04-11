'use strict';
var domain = require('domain');
var util = require('util');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require('async');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants');
var incr = require('../incrementer');
var handleSetupComplete = require('../handle-setup-complete');
function handleBadOptions(opts) {
}
module.exports = function (suman, zuite) {
    return function ($desc, $opts, $fn) {
        handleSetupComplete(zuite);
        var args = pragmatik.parse(arguments, rules.testCaseSignature, {
            preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
        });
        var desc = args[0], opts = args[1], fn = args[2];
        handleBadOptions(opts);
        if (!fn) {
            zuite.getTests().push({ testId: incr(), desc: desc, stubbed: true });
            return zuite;
        }
        desc = desc || fn.name;
        if (opts.skip) {
            zuite.getTests().push({ testId: incr(), desc: desc, skipped: true });
            return zuite;
        }
        if (suman.itOnlyIsTriggered && !opts.only) {
            zuite.getTests().push({ testId: incr(), desc: desc, skipped: true, skippedDueToItOnly: true });
            return zuite;
        }
        if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
            console.error(' => Suman usage error => "plan" option is not an integer.');
            process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
            return;
        }
        if (opts.hasOwnProperty('parallel')) {
            if (opts.hasOwnProperty('mode')) {
                console.log(' => Suman warning => Used both parallel and mode options => mode will take precedence.');
                if (opts.mode !== 'parallel' && opts.mode !== 'series' && opts.mode !== 'serial') {
                    console.log(' => Suman warning => valid "môde" options are only values of "parallel" or "series" or "serial"' +
                        ' => ("serial" is an alias to "series").');
                }
            }
        }
        var testData = {
            testId: incr(),
            stubbed: false,
            data: {},
            planCountExpected: opts.plan,
            originalOpts: opts,
            only: opts.only,
            skip: opts.skip,
            value: opts.value,
            throws: opts.throws,
            parallel: (opts.parallel === true || opts.mode === 'parallel'),
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
        if (opts.parallel || (zuite.parallel && opts.parallel !== false)) {
            zuite.getParallelTests().push(testData);
        }
        else {
            zuite.getTests().push(testData);
        }
        return zuite;
    };
};
