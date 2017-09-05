'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import fs = require('fs');
import assert = require('assert');

//npm
import * as chalk from 'chalk';
import su from 'suman-utils';

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');
const testErrors = _suman.testErrors = _suman.testErrors || [];
const errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];

////////////////////////////////////////////////////////////////////

_suman.isActualExitHandlerRegistered = true;

process.prependListener('exit', function (code: number) {

  _suman.log('raw exit code', code);

  if (errors.length > 0) {
    code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
    errors.forEach(function (e: Error) {
      let eStr = su.getCleanErrorString(e);
      _suman.usingRunner &&  process.stderr.write(eStr);
      _suman._writeTestError &&  _suman._writeTestError(eStr);
    });
  }
  else if (testErrors.length > 0) {
    code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
  }

  if (_suman._writeTestError) {
    _suman._writeTestError('\n\n ### Suman end run ### \n\n\n\n', {suppress: true});
  }

  if (_suman._writeLog) {
    if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
      _suman._writeLog('\n\n\ [ end of Suman run in SUMAN_SINGLE_PROCESS mode ]');
    }
    else {
      _suman._writeLog('\n\n\ [ end of Suman individual test run for file => "' + _suman._currentModule + '" ]');
    }
  }

  if (code > 0 && testErrors.length < 1) {   //TODO: fix this with logic saying if code > 0 and code < 60 or something
    if (!_suman.usingRunner) { //TODO: need to fix this
      process.stdout.write('\n\n =>' + chalk.underline.bold.yellow(' Suman test process experienced a fatal error during the run, ' +
        'most likely the majority of tests, if not all tests, were not run.') + '\n');
    }
  }

  if (_suman.checkTestErrorLog) {
    process.stdout.write('\n\n =>' + chalk.yellow(' You have some additional errors/warnings - ' +
      'check the test debug log for more information.' + '\n'));
    process.stdout.write(' => ' + chalk.underline.bold.yellow(_suman.sumanHelperDirRoot + '/logs/test-debug.log'));
    process.stdout.write('\n\n');
  }

  if (Number.isInteger(_suman.expectedExitCode)) {
    if (code !== _suman.expectedExitCode) {
      let msg = `Expected exit code not met. Expected => ${_suman.expectedExitCode}, actual => ${code}`;
      _suman._writeTestError(msg);
      _suman.logError(msg);
      code = constants.EXIT_CODES.EXPECTED_EXIT_CODE_NOT_MET;
    }
    else {
      console.log('\n');
      _suman.log(chalk.bgBlack.green(' Expected exit code was met. '));
      _suman.log(chalk.bgBlack.green(` Expected exit code was =>  '${code}'.`));
      _suman.log(chalk.bgBlack.green(' Because the expected exit code was met, we will exit with code 0. '));
      code = 0;
    }
  }

  if (!_suman.usingRunner) {

    let extra = '';
    if (code > 0) {
      extra = ' => see http://sumanjs.org/exit-codes.html';
    }

    console.log('\n');

    let start;
    if (start = process.env['SUMAN_START_TIME']) {
      _suman.log('Absolute total time => ', (Date.now() - start));
    }
    _suman.log('Suman test is exiting with code ' + code + ' ', extra);
    console.log('\n');
  }

  if (typeof _suman.absoluteLastHook === 'function') {
    _suman.absoluteLastHook(code);
  }

  // => we probably don't need this...
  process.exit(code, true);

});

