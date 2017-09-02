'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
import * as chalk from 'chalk';

const debug = require('suman-debug')('child');
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
require('../helpers/add-suman-global-properties');
const {constants} = require('../../config/suman-constants');
const {fatalRequestReply} = require('../helpers/fatal-request-reply');

//////////////////////////////////////////////////////////////////////////////

if (process.env.NPM_COLORS === 'no') {
  //note that we set this here in case NPM "colors" package needs to this set before hand...
  process.argv.push('--no-color');
  console.log(' => Suman child process setting itself to be color-free (--no-colors)');
}

//////////////////////////////////////////////////////////////////////////////

const sumanOpts = _suman.sumanOpts = (_suman.sumanOpts || JSON.parse(process.env.SUMAN_OPTS));
const usingRunner = _suman.usingRunner = true;
const projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT;

process.send = process.send || function (data) {
  console.error(chalk.magenta('Suman implementation warning => '));
  console.error('process.send() was not originally defined in this process.');
  console.error('(Perhaps we are using Istanbul?), we are logging the first argument to process.send() here => ');
  console.error(chalk.red(typeof  data === 'string' ? data : util.inspect(data)));
};

process.on('uncaughtException', function (err: Error) {

  debugger;

  if (_suman.afterAlwaysEngaged) {
    // after.always hooks are running, let them complete as much as possible
    return;
  }

  if (!err) {
    err = new Error('falsy value passed to uncaught exception handler.')
  }

  if (typeof err !== 'object') {
    err = {
      message: typeof err === 'string' ? err : util.inspect(err),
      stack: typeof err === 'string' ? err : util.inspect(err)
    }
  }

  setTimeout(function () {

    if (_suman.afterAlwaysEngaged) {
      // after.always hooks are running, let them complete as much as possible
      // error will logged by uncaughtException handler in after always routine
      return;
    }

    // we let more recently registered uncaughtException handlers take care of this

    if (!err._alreadyHandledBySuman) {
      err._alreadyHandledBySuman = true;

      console.error(' => Suman => Uncaught exception in your test =>', '\n', (err.stack || err) + '\n\n');

      fatalRequestReply({
        type: constants.runner_message_type.FATAL,
        data: {
          msg: ' => Suman => fatal error in suite with path="' + filePath + '"' +
          '\n (note: You will need to transpile your test files if you wish to use "ES-next" features)',
          error: err.stack || err
        }
      }, function () {
        process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
      });

    }
  }, 450);

});

const filePath = process.env.SUMAN_CHILD_TEST_PATH;

let sumanConfig;
if (process.env.SUMAN_CONFIG) {
  assert(typeof process.env.SUMAN_CONFIG === 'string', 'process.env.SUMAN_CONFIG is not a string.');
  sumanConfig = _suman.sumanConfig = JSON.parse(process.env.SUMAN_CONFIG);
}
else {
  sumanConfig = _suman.sumanConfig = require(path.resolve(projectRoot + '/suman.conf.js'));
}

const sumanHelperDirRoot = _suman.sumanHelperDirRoot = process.env['SUMAN_HELPERS_DIR_ROOT'];

assert(sumanHelperDirRoot,
  ' => sumanHelperDirRoot should be defined by process.env.SUMAN_HELPERS_DIR_ROOT, but is null/undefined');

//////////////////////////////////////////////////

require('../helpers/log-stdio-of-child').run(filePath);

//////////////////////////////////////////////////////////

const useBabelRegister = _suman.useBabelRegister = sumanOpts.$useBabelRegister;

if (useBabelRegister) {
  console.error(chalk.bgRed.white(' => We are using babel-register.'));
  require('babel-register')({
    // This will override `node_modules` ignoring - you can alternatively pass
    // an array of strings to be explicitly matched or a regex / glob
    ignore: /node_modules/
  });
}

////////////////////////////////////////////////////////

const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';

//////// delete env vars that should not get passed to any cp's forked from this process //////////

//TODO delete more vars
// delete process.env.SUMAN_SINGLE_PROCESS;

///////////////////////////////////////////////////////////////////////////////////////////////////

try {
  //load globals
  require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));
}
catch (err) {
  _suman.logError(chalk.yellow.bold('Suman usage warning => Could not load your suman.globals.js file.'));
  _suman.logError(err.stack || err);
}

if (singleProc) {
  require('../handle-single-proc')(JSON.parse(process.env.SUMAN_SINGLE_PROCESS_FILES));
}
else {
  require(filePath);
}

