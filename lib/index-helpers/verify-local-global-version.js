'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var pkgDotJSON = require('../../package.json');
var _suman = global.__suman = (global.__suman || {});
var debug = require('suman-debug')('s:index');
var gv;
if (gv = process.env.SUMAN_GLOBAL_VERSION) {
    var lv = String(pkgDotJSON.version);
    debug(' => Global version => ', gv);
    debug(' => Local version => ', lv);
    if (gv !== lv) {
        console.error('\n');
        _suman.logError(chalk.red('warning => You local version of Suman differs from the cli version of Suman.'));
        _suman.logError(chalk.cyan('Global version => '), gv);
        _suman.logError(chalk.cyan('Local version => '), lv);
        console.error('\n');
    }
}
