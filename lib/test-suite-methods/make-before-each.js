'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var util = require('util');
var pragmatik = require('pragmatik');
var async = require('async');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants').constants;
var handleSetupComplete = require('../handle-setup-complete');
function handleBadOptions(opts) {
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
}
exports.makeBeforeEach = function (suman, zuite) {
    return function ($desc, $opts, $aBeforeEach) {
        handleSetupComplete(zuite, 'beforeEach');
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
        });
        var desc = args[0], opts = args[1], arr = args[2], fn = args[3];
        handleBadOptions(opts);
        if (arr && fn) {
            throw new Error(' => Please define either an array or callback.');
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
            var preVal_1 = [];
            arrayDeps.forEach(function (a) {
                if (/:/.test(a)) {
                    preVal_1.push(a);
                }
            });
            var toEval = ['(function self(){return {', preVal_1.join(','), '}})()'].join('');
            var obj = eval(toEval);
            Object.assign(opts, obj);
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
                desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
                fn: fn,
                throws: opts.throws,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                cb: opts.cb || false,
                type: 'beforeEach/setupTest',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
