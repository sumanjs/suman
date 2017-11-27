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
var handleBadOptions = function (opts) {
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
exports.makeAfterAllParentHooks = function (suman) {
    return function afterAllParentHooks($desc, $opts) {
        var zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, afterAllParentHooks.name);
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: su.isObject($opts) ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        var vetted = general_1.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            general_1.evalOptions(arrayDeps, opts);
        }
        if (opts.skip) {
            suman.numHooksSkipped++;
        }
        else if (!fn) {
            suman.numHooksStubbed++;
        }
        else {
            zuite.getAfterAllParentHooks().push({
                ctx: zuite,
                timeout: opts.timeout || 11000,
                desc: desc || fn.name,
                cb: opts.cb || false,
                throws: opts.throws,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                always: opts.always,
                last: opts.last,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                type: 'afterAllParentHooks',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
