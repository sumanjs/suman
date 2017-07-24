'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var _suman = global.__suman = (global.__suman || {});
_suman.shutdownEmitter = _suman.shutdownEmitter = (_suman.shutdownEmitter || new EE());
var maxMem = _suman.maxMem = {
    heapTotal: 0,
    heapUsed: 0
};
if (_suman.sumanConfig && _suman.sumanConfig.checkMemoryUsage) {
    var interval_1 = setInterval(function () {
        var m = process.memoryUsage();
        if (m.heapTotal > maxMem.heapTotal) {
            maxMem.heapTotal = m.heapTotal;
        }
        if (m.heapUsed > maxMem.heapUsed) {
            maxMem.heapUsed = m.heapUsed;
        }
    }, 100);
    _suman.shutdownEmitter.once('closing', function () {
        clearInterval(interval_1);
    });
}
