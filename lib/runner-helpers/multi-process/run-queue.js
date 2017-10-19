'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
exports.makeRunQueue = function () {
    var sumanConfig = _suman.sumanConfig, maxProcs = _suman.maxProcs;
    return async.queue(function (task, cb) {
        task(cb);
    }, maxProcs);
};
