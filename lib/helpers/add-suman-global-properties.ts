'use strict';

import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import * as chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

debugger;

if (!('SUMAN_INCEPTION_LEVEL' in process.env) || process.argv.indexOf('--force-inception-level-zero')) {
  _suman.inceptionLevel = 0;
  process.env.SUMAN_INCEPTION_LEVEL = 0;
}
else {
  let sil = Number(process.env.SUMAN_INCEPTION_LEVEL);
  let silVal = ++sil;
  _suman.inceptionLevel = silVal;
  process.env.SUMAN_INCEPTION_LEVEL = silVal;
}

if (_suman.inceptionLevel < 1) {
  _suman.log = _suman.logInfo = console.log.bind(console, chalk.gray.bold(' [suman] '));
  _suman.logWarning = console.error.bind(console, chalk.yellow(' [suman] '));
  _suman.logError = console.error.bind(console, chalk.red(' [suman] '));
  // _suman.log = _suman.logInfo = console.log.bind(console, chalk.gray.bold(' => [suman] => '));
  // _suman.logWarning = console.error.bind(console, chalk.yellow(' => [suman] => '));
  // _suman.logError = console.error.bind(console, chalk.red(' => [suman] => '));
}
else {
  _suman.$forceInheritStdio = true;
  _suman.log = _suman.logInfo = console.log.bind(console);
  _suman.logWarning = console.error.bind(console);
  _suman.logError = console.error.bind(console);
}

