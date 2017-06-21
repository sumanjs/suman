'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const util = require('util');
const assert = require('assert');
const EE = require('events');

//npm
const colors = require('colors/safe');
const debug = require('suman-debug')('child');
const su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
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
    console.error(colors.magenta('=> Suman implementation warning => Runner cannot receive data because process.send was not defined ' +
        '(Perhaps we are using Istanbul?), so logging it here => '),
      '\n', colors.yellow(typeof  data === 'string' ? data : util.inspect(data)));
  };

process.on('uncaughtException', function (err) {

  if (_suman.afterAlwaysEngaged) {
    // after.always hooks are running, let them complete as much as possible
    return;
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
          '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
          error: err.stack || err
        }
      }, function () {

        if (String(err.stack || err).match(/Cannot find module/i) && _suman.sumanOpts && _suman.sumanOpts.transpile) {
          console.error(' => If transpiling, you may need to transpile your entire test directory to the target directory using the ' +
            '--transpile options together.')
        }

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

const sumanHelperDirRoot = _suman.sumanHelperDirRoot = process.env.SUMAN_HELPERS_DIR_ROOT;

assert(sumanHelperDirRoot,
  ' => sumanHelperDirRoot should be defined by process.env.SUMAN_HELPERS_DIR_ROOT, but is null/undefined');

//////////////////////////////////////////////////

require('../helpers/log-stdio-of-child')(filePath);

//////////////////////////////////////////////////////////

const useBabelRegister = _suman.useBabelRegister = (process.env.USE_BABEL_REGISTER === 'yes');

if (useBabelRegister) {
  console.error(colors.bgRed.white(' => We are using babel-register.'));
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
  console.error(colors.yellow.bold(' => Suman usage warning => Could not load your suman.globals.js file.'));
  console.error(err.stack || err);
}

if (singleProc) {
  require('../handle-single-proc')(JSON.parse(process.env.SUMAN_SINGLE_PROCESS_FILES));
}
else {
  require(filePath);
}

