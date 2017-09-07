'use strict';
import {IGlobalSumanObj, IPseudoError} from "../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
import util = require('util');

//npm
import chalk = require('chalk');

const sumanUtils = require('suman-utils');
const debug = require('suman-debug')('s');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';

///////////////////////////////////////////////////////////////////////////////////////////

process.on('uncaughtException', function (err: IPseudoError) {

  if (!err) {
    err = new Error('falsy value passed to uncaught exception handler.');
  }

  if (typeof err !== 'object') { // if null or string, etc
    const val = typeof err === 'string' ? err : util.inspect(err);
    console.error('\n\n', chalk.red(' => Implementation warning: value passed to uncaughtException handler ' +
      'was not typeof "object" => '), val, '\n\n');
    err = {message: val, stack: val}
  }

  setTimeout(function () {
    // we attempt to let other uncaught-exception handlers do their thing by using nextTick,
    // but if they don't take care of business, then we step in here

    if (err && !err._alreadyHandledBySuman) {
      console.error('\n', ' => Suman uncaught exception =>', '\n', (err.stack || err), '\n\n');
    }

    process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
  }, 500);

});

const sumanOpts = _suman.sumanOpts;
const sumanHelperDirRoot = _suman.sumanHelperDirRoot;
const sumanConfig = _suman.sumanConfig;
const useBabelRegister = _suman.useBabelRegister = sumanOpts.$useBabelRegister;

try {
  require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals
}
catch (err) {
  console.error('\n', chalk.yellow.bold(' => Suman usage warning => Could not load your suman.globals.js file.'));
  console.error(err.message || err);
  console.error(' => Suman will continue optimistically, even though your suman.globals.js file could not be loaded.');
}

export const run = function (files: Array<string>) {

  if (useBabelRegister) {
    console.log(chalk.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly'));
    console.log(chalk.bgWhite.black.bold('use the -v option for more info.'));
    console.log('\n\n');

    require('babel-register')({
      ignore: /node_modules/
      // This will override `node_modules` ignoring - you can alternatively pass
      // an array of strings to be explicitly matched or a regex / glob
      // ignore: false
    });
  }

  process.prependListener('exit', function (code: number) {
    if(!_suman.isActualExitHandlerRegistered){
      _suman.logError(chalk.magenta('Warning, you may have failed to point Suman to an actual Suman test file.');
      _suman.logError(chalk.magenta('Or there was an immediate error, which prevented any other exit handlers from being registered.'));
    }
  });

  if (SUMAN_SINGLE_PROCESS) {
    _suman.log('debug message => we are in SUMAN_SINGLE_PROCESS mode.');
    require('./helpers/log-stdio-of-child').run('suman-single-process');
    require('./handle-single-proc').run(files);
  }
  else {
    _suman.log(`running this single test file => "${files[0]}"`);
    require('./helpers/log-stdio-of-child').run(files[0]);
    require(files[0]);
  }

};


