'use strict';

//typescript imports
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import chalk from 'chalk';
import su = require('suman-utils');

// load the suman package.json file
const pkgDotJSON = require('../../package.json');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////////////////

let gv: string;

if (gv = process.env.SUMAN_GLOBAL_VERSION) {
  const lv = String(pkgDotJSON.version);

  if (su.vgt(6)) {
    console.log(chalk.gray.bold(' [suman] '), ' => Global version => ', gv);
    console.log(chalk.gray.bold(' [suman] '), ' => Local version => ', lv);
  }

  if (gv !== lv) {
    console.error('\n');
    _suman.log.error(chalk.red('warning => You local version of Suman differs from the cli version of Suman.'));
    _suman.log.error(chalk.cyan('Global version => '), gv);
    _suman.log.error(chalk.cyan('Local version => '), lv);
    console.error('\n');
  }
}
