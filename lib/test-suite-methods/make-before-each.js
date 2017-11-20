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
    timeout: true,
    throws: true,
    cb: true,
    sourced: true,
    retries: true,
    desc: true,
    title: true,
    plan: true,
    fatal: true,
    skip: true,
    events: true,
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
            throw new Error("'" + k + "' is not a valid option property for an " + typeName + " hook. See: " + url);
        }
    });
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
exports.makeBeforeEach = function (suman) {
    return function beforeEach($$desc, $opts) {
        var typeName = beforeEach.name;
        var zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, typeName);
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: su.isObject($opts) ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) { }
        var vetted = general_2.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts, typeName);
        if (arrayDeps.length > 0) {
            general_3.evalOptions(arrayDeps, opts);
        }
        if (opts.skip) {
            suman.numHooksSkipped++;
        }
        else if (!fn) {
            suman.numHooksStubbed++;
        }
        else {
            zuite.getBeforeEaches().push({
                ctx: zuite,
                timeout: opts.timeout || 11000,
                desc: desc || fn.name || '(unknown before-each-hook name)',
                fn: fn,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                retries: opts.retries,
                throws: opts.throws,
                planCountExpected: opts.plan,
                fatal: opts.fatal === true,
                cb: opts.cb || false,
                type: 'beforeEach/setupTest',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
