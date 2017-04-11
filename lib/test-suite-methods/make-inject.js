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
var handleSetupComplete = require('../handle-setup-complete');
function handleBadOptions(opts) {
}
module.exports = function (suman, zuite) {
    return function ($desc, $opts, $fn) {
        handleSetupComplete(zuite);
        var args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
        });
        var desc = args[0], opts = args[1], fn = args[2];
        handleBadOptions(opts);
        if (opts.skip) {
            _suman._writeTestError(' => Warning => Inject hook was skipped.');
        }
        else if (!fn) {
            _suman._writeTestError(' => Warning => Inject hook was stubbed.');
        }
        else {
            zuite.getInjections().push({
                ctx: zuite,
                desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
                timeout: opts.timeout || 11000,
                cb: opts.cb || false,
                throws: opts.throws,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                timeOutError: new Error('*timed out* - did you forget to call done/ctn/fatal()?'),
                type: 'inject',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
