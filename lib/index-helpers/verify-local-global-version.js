'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
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
        _suman.logError(colors.red('warning => You local version of Suman differs from the cli version of Suman.'));
        _suman.logError(colors.cyan('Global version => '), gv);
        _suman.logError(colors.cyan('Local version => '), lv);
        console.error('\n');
    }
}
