'use strict';
import {IPseudoError} from "../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const util = require('util');

//npm
const colors = require('colors/safe');
const sumanUtils = require('suman-utils');
const debug = require('suman-debug')('s');

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const USE_BABEL_REGISTER = process.env.USE_BABEL_REGISTER === 'yes';

///////////////////////////////////////////////////////////////////////////////////////////

process.on('uncaughtException', function (err: IPseudoError) {

  if (typeof err !== 'object') { // if null or string, etc
    const val = typeof err === 'string' ? err : util.inspect(err);
    console.error(' => Warning, value passed to uncaughtException handler was not typeof "object" => ', val);
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

const root = _suman.projectRoot || sumanUtils.findProjectRoot(process.cwd());
const sumanHelperDirRoot = _suman.sumanHelperDirRoot;
const sumanConfig = _suman.sumanConfig;


try {
  require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals
}
catch (err) {
  console.error('\n', colors.yellow.bold(' => Suman usage warning => Could not load your suman.globals.js file.'));
  console.error(err.stack || err);
  console.error(' => Suman will continue optimistically, even though your suman.globals.js file could not be loaded.');
}

export = function run(files: Array<string>) {

  if (USE_BABEL_REGISTER) {
    console.log(colors.bgWhite.black.bold(' => Suman will use babel-register to transpile your sources on the fly, ' +
      'use the -v option for more info.'), '\n\n');

    require('babel-register')({
      ignore: /node_modules/
      // This will override `node_modules` ignoring - you can alternatively pass
      // an array of strings to be explicitly matched or a regex / glob
      // ignore: false
    });
  }

  if (SUMAN_SINGLE_PROCESS) {
    _suman.log('debug message => we are in SUMAN_SINGLE_PROCESS mode.');
    require('./helpers/log-stdio-of-child')('suman-single-process');
    require('./handle-single-proc')(files);
  }
  else {
    require('./helpers/log-stdio-of-child')(files[0]);
    require(files[0]);
  }

}

