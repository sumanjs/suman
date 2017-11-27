'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var general_2 = require("../helpers/general");
var general_3 = require("../helpers/general");
var acceptableOptions = {
    '@DefineObjectOpts': true,
    plan: true,
    throws: true,
    fatal: true,
    sourced: true,
    retries: true,
    cb: true,
    timeout: true,
    skip: true,
    desc: true,
    title: true,
    events: true,
    first: true,
    last: true,
    successEvent: true,
    errorEvent: true,
    successEvents: true,
    errorEvents: true,
    __preParsed: true
};
var handleBadOptions = function (opts, typeName) {
    Object.keys(opts).forEach(function (k) {
        if (!acceptableOptions[k]) {
            var url = constants.SUMAN_TYPES_ROOT_URL + "/" + typeName + ".d.ts";
            throw new Error("'" + k + "' is not a valid option property for a " + typeName + " hook. See: " + url);
        }
    });
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        _suman.log.error(new Error('Suman usage error => "plan" option is not an integer.').stack);
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    }
};
exports.makeBefore = function (suman) {
    return function before($$desc, $opts) {
        var zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, before.name);
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: su.isObject($opts) && $opts.__preParsed
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        var vetted = general_3.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts, before.name);
        if (arrayDeps.length > 0) {
            general_2.evalOptions(arrayDeps, opts);
        }
        if (opts.last && opts.first) {
            throw new Error('Cannot use both "first" and "last" option for "after" hook.');
        }
        if (opts.skip) {
            suman.numHooksSkipped++;
        }
        else if (!fn) {
            suman.numHooksStubbed++;
        }
        else {
            var obj = {
                ctx: zuite,
                desc: desc || fn.name || '(unknown before-hook name)',
                timeout: opts.timeoutVal || opts.timeout || 11000,
                cb: opts.cb || false,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                retries: opts.retries,
                throws: opts.throws,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                type: 'before/setup',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            };
            if (opts.first) {
                zuite.getBeforesFirst().push(obj);
            }
            else if (opts.last) {
                zuite.getBeforesLast().push(obj);
            }
            else {
                zuite.getBefores().push(obj);
            }
        }
        return zuite;
    };
};
