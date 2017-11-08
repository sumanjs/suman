'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk_1 = require("chalk");
var su = require("suman-utils");
var pkgDotJSON = require('../../package.json');
var _suman = global.__suman = (global.__suman || {});
var gv;
if (gv = process.env.SUMAN_GLOBAL_VERSION) {
    var lv = String(pkgDotJSON.version);
    if (su.vgt(6)) {
        console.log(chalk_1.default.gray.bold(' [suman] '), ' => Global version => ', gv);
        console.log(chalk_1.default.gray.bold(' [suman] '), ' => Local version => ', lv);
    }
    if (gv !== lv) {
        console.error('\n');
        _suman.log.error(chalk_1.default.red('warning => You local version of Suman differs from the cli version of Suman.'));
        _suman.log.error(chalk_1.default.cyan('Global version => '), gv);
        _suman.log.error(chalk_1.default.cyan('Local version => '), lv);
        console.error('\n');
    }
}
