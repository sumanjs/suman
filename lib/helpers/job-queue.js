'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var queue, envTotal, envConfig;
if (process.env.DEFAULT_PARALLEL_TOTAL_LIMIT && (envTotal = Number(process.env.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
    assert(Number.isInteger(envTotal), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
}
exports.getQueue = function () {
    if (!queue) {
        var sumanConfig = _suman.sumanConfig, sumanOpts = _suman.sumanOpts;
        if (sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT &&
            (envConfig = Number(_suman.sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
            assert(Number.isInteger(envConfig), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
        }
        var c = 1;
        if (!sumanOpts.series) {
            c = envTotal || envConfig || constants.DEFAULT_PARALLEL_TOTAL_LIMIT;
        }
        assert(Number.isInteger(c) && c > 0 && c < 301, 'DEFAULT_PARALLEL_TOTAL_LIMIT must be an integer between 1 and 300 inclusive.');
        queue = async.queue(function (task, cb) {
            task(cb);
        }, c);
    }
    return queue;
};
