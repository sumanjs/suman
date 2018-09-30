'use strict';

//dts
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

  if (gv !== lv) {
    console.error('\n');
    _suman.log.error(chalk.red('warning => You local version of Suman differs from the cli version of Suman.'));
    _suman.log.warning(chalk.gray.bold(' [suman] '), 'Suman global version => ', gv);
    _suman.log.warning(chalk.gray.bold(' [suman] '), 'Suman local version => ', lv);
    console.error('\n');
  }
}
