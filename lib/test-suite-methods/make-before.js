'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants').constants;
var handleSetupComplete = require('../handle-setup-complete').handleSetupComplete;
var eval_options_1 = require("../helpers/eval-options");
var parse_pragmatik_args_1 = require("../helpers/parse-pragmatik-args");
function handleBadOptions(opts) {
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
}
exports.makeBefore = function (suman, zuite) {
    return function ($$desc, $opts) {
        handleSetupComplete(zuite, 'before');
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: suman_utils_1.default.isObject($opts) ? $opts.__preParsed : null
        });
        var vetted = parse_pragmatik_args_1.default(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            eval_options_1.default(arrayDeps, opts);
        }
        if (opts.skip) {
            suman.numHooksSkipped++;
        }
        else if (!fn) {
            suman.numHooksStubbed++;
        }
        else {
            zuite.getBefores().push({
                ctx: zuite,
                desc: desc || fn.name,
                timeout: opts.timeout || 11000,
                cb: opts.cb || false,
                throws: opts.throws,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                timeOutError: new Error('*timed out* - did you forget to call done/ctn/fatal()?'),
                type: 'before/setup',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
