'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
debugger;
if (!('SUMAN_INCEPTION_LEVEL' in process.env)) {
    _suman.inceptionLevel = 0;
    process.env.SUMAN_INCEPTION_LEVEL = 0;
}
else {
    var sil = Number(process.env.SUMAN_INCEPTION_LEVEL);
    var silVal = ++sil;
    _suman.inceptionLevel = silVal;
    process.env.SUMAN_INCEPTION_LEVEL = silVal;
}
if (_suman.inceptionLevel < 1) {
    _suman.log = _suman.logInfo = console.log.bind(console, colors.gray.bold(' => [suman] => '));
    _suman.logWarning = console.error.bind(console, colors.yellow(' => [suman] => '));
    _suman.logError = console.error.bind(console, colors.red(' => [suman] => '));
}
else {
    _suman.$forceInheritStdio = true;
    _suman.log = _suman.logInfo = console.log.bind(console);
    _suman.logWarning = console.error.bind(console);
    _suman.logError = console.error.bind(console);
}
