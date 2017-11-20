'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var pragmatik = require('pragmatik');
var _ = require('underscore');
var _suman = global.__suman = (global.__suman || {});
var general_1 = require("../helpers/general");
var rules = require("../helpers/handle-varargs");
var constants = require('../../config/suman-constants').constants;
var general_2 = require("../helpers/general");
var acceptableOptions = {
    '@DefineObjectOpts': true,
    plan: true,
    throws: true,
    fatal: true,
    cb: true,
    timeout: true,
    sourced: true,
    desc: true,
    title: true,
    skip: true,
    events: true,
    successEvents: true,
    errorEvents: true,
    successEvent: true,
    errorEvent: true,
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
        _suman.log.error(new Error('Suman usage error => "plan" option is not an integer.').stack);
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
exports.makeInject = function (suman) {
    return function inject($desc, $opts, $fn) {
        var typeName = inject.name;
        var zuite = suman.ctx;
        general_2.handleSetupComplete(zuite, typeName);
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        var desc = args[0], opts = args[1], arr = args[2], fn = args[3];
        handleBadOptions(opts, typeName);
        if (arr && fn) {
            throw new Error('Please use either an array or function, but not both.');
        }
        var arrayDeps;
        if (arr) {
            fn = arr[arr.length - 1];
            assert.equal(typeof fn, 'function', ' => Suman usage error => ' +
                'You need to pass a function as the last argument to the array.');
            arrayDeps = arr.slice(0, -1);
        }
        arrayDeps = arrayDeps || [];
        if (arrayDeps.length > 0) {
            general_1.evalOptions(arrayDeps, opts);
        }
        if (opts.skip) {
            _suman.writeTestError(new Error('Suman usage warning => Inject hook was *skipped* by the developer.').stack);
        }
        else if (!fn) {
            _suman.writeTestError(new Error('Suman usage warning => Inject hook was *stubbed* by the developer.').stack);
        }
        else {
            zuite.getInjections().push({
                ctx: zuite,
                desc: desc || fn.name || constants.UNKNOWN_INJECT_HOOK_NAME,
                timeout: opts.timeout || 11000,
                cb: opts.cb || false,
                throws: opts.throws,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                type: typeName,
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
