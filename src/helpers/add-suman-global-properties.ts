'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import chalk from 'chalk';
import {lp} from 'log-prepend';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

if (('SUMAN_INCEPTION_LEVEL' in process.env) && process.argv.indexOf('--force-inception-level-zero') < 0) {
  let sil = parseInt(process.env.SUMAN_INCEPTION_LEVEL);
  let silVal = ++sil;
  _suman.inceptionLevel = silVal;
  process.env.SUMAN_INCEPTION_LEVEL = silVal;
}
else {
  _suman.inceptionLevel = 0;
  process.env.SUMAN_INCEPTION_LEVEL = 0;
}

_suman.log = {} as any;

if (_suman.inceptionLevel < 1 && String(process.env.SUMAN_USE_STDIO_PREFIX).trim() !== 'no') {

  // _suman.log = _suman.logInfo = console.log.bind(console, chalk.gray.bold(' [suman] '));
  // _suman.logWarning = console.error.bind(console, chalk.yellow(' [suman] '));
  // _suman.logError = console.error.bind(console, chalk.red(' [suman] '));

  const resetterFn = function () {
    // this is used for adding whitespace in the right place in the console logs
    _suman.isTestMostRecentLog = false;
  };

  _suman.log.info = lp(chalk.gray.bold(' [suman] '), process.stdout, null, resetterFn);
  _suman.log.good = lp(chalk.cyan.bold(' [suman] '), process.stdout, null, resetterFn);
  _suman.log.verygood = lp(chalk.green.bold(' [suman] '), process.stdout, null, resetterFn);
  _suman.log.warning = lp(chalk.yellow(' [suman] '), process.stderr, null, resetterFn);
  _suman.log.error = lp(chalk.red(' [suman] '), process.stderr, null, resetterFn);

  // _suman.log = _suman.logInfo = console.log.bind(console, chalk.gray.bold(' => [suman] => '));
  // _suman.logWarning = console.error.bind(console, chalk.yellow(' => [suman] => '));
  // _suman.logError = console.error.bind(console, chalk.red(' => [suman] => '));
}
else {
  _suman.$forceInheritStdio = true;
  
  if(_suman.sumanOpts){
    _suman.sumanOpts.$forceInheritStdio = true;
  }
  
  _suman.log.info = console.log.bind(console);
  _suman.log.warning = console.error.bind(console);
  _suman.log.error = console.error.bind(console);
  _suman.log.verygood = console.log.bind(console);
  _suman.log.good = console.log.bind(console);
}

