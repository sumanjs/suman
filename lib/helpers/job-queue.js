'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var async = require('async');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var queue, envTotal, envConfig;
if (process.env.DEFAULT_PARALLEL_TOTAL_LIMIT && (envTotal = Number(process.env.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
    assert(Number.isInteger(envTotal), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
}
exports.getQueue = function () {
    if (!queue) {
        if (_suman.sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT &&
            (envConfig = Number(_suman.sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
            assert(Number.isInteger(envConfig), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
        }
        var concurrency = envTotal || envConfig || constants.DEFAULT_PARALLEL_TOTAL_LIMIT;
        queue = async.queue(function (task, callback) {
            task(callback);
        }, concurrency);
    }
    return queue;
};
var $exports = module.exports;
exports.default = $exports;
