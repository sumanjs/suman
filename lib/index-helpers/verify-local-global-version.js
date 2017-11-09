'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var pkgDotJSON = require('../../package.json');
var _suman = global.__suman = (global.__suman || {});
var gv;
if (gv = process.env.SUMAN_GLOBAL_VERSION) {
    var lv = String(pkgDotJSON.version);
    if (gv !== lv) {
        console.error('\n');
        _suman.log.error(chalk.red('warning => You local version of Suman differs from the cli version of Suman.'));
        _suman.log.warning(chalk.gray.bold(' [suman] '), 'Suman global version => ', gv);
        _suman.log.warning(chalk.gray.bold(' [suman] '), 'Suman local version => ', lv);
        console.error('\n');
    }
}
