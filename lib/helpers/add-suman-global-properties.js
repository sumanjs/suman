'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var log_prepend_1 = require("log-prepend");
var _suman = global.__suman = (global.__suman || {});
if (!('SUMAN_INCEPTION_LEVEL' in process.env) || process.argv.indexOf('--force-inception-level-zero')) {
    _suman.inceptionLevel = 0;
    process.env.SUMAN_INCEPTION_LEVEL = 0;
}
else {
    var sil = Number(process.env.SUMAN_INCEPTION_LEVEL);
    var silVal = ++sil;
    _suman.inceptionLevel = silVal;
    process.env.SUMAN_INCEPTION_LEVEL = silVal;
}
_suman.log = {};
if (_suman.inceptionLevel < 1) {
    _suman.log = _suman.logInfo = log_prepend_1.lp(chalk.gray.bold(' [suman] '), process.stdout);
    _suman.logWarning = log_prepend_1.lp(chalk.yellow(' [suman] '), process.stderr);
    _suman.logError = log_prepend_1.lp(chalk.red(' [suman] '), process.stderr);
}
else {
    _suman.$forceInheritStdio = true;
    _suman.log = _suman.logInfo = console.log.bind(console);
    _suman.logWarning = console.error.bind(console);
    _suman.logError = console.error.bind(console);
}
