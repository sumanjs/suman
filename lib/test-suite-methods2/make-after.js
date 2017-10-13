'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var pragmatik = require('pragmatik');
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants').constants;
var handleSetupComplete = require('../handle-setup-complete').handleSetupComplete;
var eval_options_1 = require("../helpers/eval-options");
var parse_pragmatik_args_1 = require("../helpers/parse-pragmatik-args");
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
        var ctx = suman.ctx;
        assert.equal(ctx, zuite, 'Fatal usage error - test block method was registered asynchronously.');
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: suman_utils_1.default.isObject($opts) ? $opts.__preParsed : null
        });
        var vetted = parse_pragmatik_args_1.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            eval_options_1.default(arrayDeps, opts);
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
                ctx: ctx,
                timeout: opts.timeout || 11000,
                desc: desc || fn.name,
                cb: opts.cb || false,
                throws: opts.throws,
                always: opts.always,
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
