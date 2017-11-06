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
if (_suman.inceptionLevel < 1 && String(process.env.SUMAN_USE_STDIO_PREFIX).trim() !== 'no') {
    var resetterFn = function () {
        _suman.isTestMostRecentLog = false;
    };
    _suman.log.info = log_prepend_1.lp(chalk.gray.bold(' [suman] '), process.stdout, null, resetterFn);
    _suman.log.good = log_prepend_1.lp(chalk.cyan.bold(' [suman] '), process.stdout, null, resetterFn);
    _suman.log.verygood = log_prepend_1.lp(chalk.green.bold(' [suman] '), process.stdout, null, resetterFn);
    _suman.log.warning = log_prepend_1.lp(chalk.yellow(' [suman] '), process.stderr, null, resetterFn);
    _suman.log.error = log_prepend_1.lp(chalk.red(' [suman] '), process.stderr, null, resetterFn);
}
else {
    _suman.$forceInheritStdio = true;
    _suman.log.info = console.log.bind(console);
    _suman.log.warning = console.error.bind(console);
    _suman.log.error = console.error.bind(console);
    _suman.log.verygood = console.log.bind(console);
    _suman.log.good = console.log.bind(console);
}
