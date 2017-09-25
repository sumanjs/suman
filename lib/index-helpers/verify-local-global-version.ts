'use strict';

//typescript imports
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import * as chalk from 'chalk';

// load the suman package.json file
const pkgDotJSON = require('../../package.json');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const debug = require('suman-debug')('s:index');

////////////////////////////////////////////////////////////////////////////////

let gv: string;

if (gv = process.env.SUMAN_GLOBAL_VERSION) {
  const lv = String(pkgDotJSON.version);

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
