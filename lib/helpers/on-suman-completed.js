'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var EE = require("events");
var debug = require('suman-debug')('s:index');
var _suman = global.__suman = (global.__suman || {});
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
function default_1(suman) {
    return function onSumanCompleted(code, msg) {
        suman.sumanCompleted = true;
        setImmediate(function () {
            suman.logFinished(code || 0, msg, function (err, val) {
                if (_suman.sumanOpts.check_memory_usage) {
                    _suman.logError('Maximum memory usage during run => ' + util.inspect({
                        heapTotal: _suman.maxMem.heapTotal / 1000000,
                        heapUsed: _suman.maxMem.heapUsed / 1000000
                    }));
                }
                suiteResultEmitter.emit('suman-completed', val);
            });
        });
    };
}
exports.default = default_1;
