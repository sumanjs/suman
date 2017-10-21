'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var constants = require('../../config/suman-constants').constants;
var handleSetupComplete = require('../handle-setup-complete').handleSetupComplete;
var general_1 = require("../helpers/general");
var general_2 = require("../helpers/general");
var typeName = 'after';
var acceptableOptions = {
    plan: true,
    throws: true,
    fatal: true,
    cb: true,
    timeout: true,
    skip: true,
    always: true,
    last: true,
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
exports.makeAfter = function (suman) {
    return function ($desc, $opts) {
        var zuite = suman.ctx;
        handleSetupComplete(zuite, typeName);
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: suman_utils_1.default.isObject($opts) ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) { }
        var vetted = general_2.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            general_1.evalOptions(arrayDeps, opts);
        }
        if (opts.always) {
            _suman.afterAlwaysHasBeenRegistered = true;
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
                timeout: opts.timeout || 11000,
                desc: desc || fn.name,
                cb: opts.cb || false,
                throws: opts.throws,
                always: opts.always,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                last: opts.last,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                type: 'after/teardown',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            };
            if (opts.last) {
                zuite.getAftersLast().push(obj);
            }
            else {
                zuite.getAfters().push(obj);
            }
        }
        return zuite;
    };
};
