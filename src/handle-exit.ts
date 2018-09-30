'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import fs = require('fs');
import assert = require('assert');

//npm
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from './config/suman-constants';
const testErrors = _suman.testErrors = _suman.testErrors || [];
const errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];

////////////////////////////////////////////////////////////////////

_suman.isActualExitHandlerRegistered = true;

if (!process.prependListener) {
  process.prependListener = process.on.bind(process);
}

if (!process.prependOnceListener) {
  process.prependOnceListener = process.on.bind(process);
}

process.prependOnceListener('exit', function (code: number) {

  const testDebugLogPath = _suman.testDebugLogPath;
  debugger; // leave it here

  if (errors.length > 0) {
    code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
    errors.forEach(function (e: Error) {
      let eStr = su.getCleanErrorString(e);
      _suman.usingRunner && process.stderr.write(eStr);
      _suman.writeTestError && _suman.writeTestError(eStr);
    });
  }
  else if (testErrors.length > 0) {
    code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
  }

  if (testDebugLogPath) {
    // fs.appendFileSync(testDebugLogPath, 'nonsesnse nonsesnse nosneses\n');
    // fs.appendFileSync(testDebugLogPath, 'nonsesnse nonsesnse nosneses\n');
    // fs.appendFileSync(testDebugLogPath, 'nonsesnse nonsesnse nosneses\n');
    // fs.appendFileSync(testDebugLogPath, 'nonsesnse nonsesnse nosneses\n');
  }

  _suman.writeTestError('\n\n ### Suman end run ### \n\n\n\n', {suppress: true});

  if (code > 0 && testErrors.length < 1) {
    if (!_suman.usingRunner) { //TODO: need to fix this
      console.log(chalk.underline.bold.yellow(' Suman test process experienced a fatal error during the run, ' +
        'most likely the majority of tests, if not all tests, were not run.') + '\n');
    }
  }

  if (_suman.checkTestErrorLog) {
    console.log(chalk.yellow(' You have some additional errors/warnings - check the test debug log for more information.'));
    console.log(' => ' + chalk.underline.bold.yellow(_suman.sumanHelperDirRoot + '/logs/test-debug.log'));
    console.log('\n');
  }

  if (Number.isInteger(_suman.expectedExitCode)) {
    if (code !== _suman.expectedExitCode) {
      let msg = `Expected exit code not met. Expected => ${_suman.expectedExitCode}, actual => ${code}`;
      _suman.writeTestError(msg);
      _suman.log.error(msg);
      code = constants.EXIT_CODES.EXPECTED_EXIT_CODE_NOT_MET;
    }
    else {
      console.log('\n');
      _suman.log.info(chalk.bgBlack.green(' Expected exit code was met. '));
      _suman.log.info(chalk.bgBlack.green(` Expected exit code was =>  '${code}'.`));
      _suman.log.info(chalk.bgBlack.green(' Because the expected exit code was met, we will exit with code 0. '));
      code = 0;
    }
  }

  if (!_suman.usingRunner) {

    let extra = '';
    if (code > 0) extra = ' => see http://sumanjs.org/exit-codes.html';

    console.log('\n');

    let start;
    if (start = process.env['SUMAN_START_TIME']) {
      _suman.log.info('Absolute total time => ', (Date.now() - start));
    }

    if(code > 0){
      _suman.log.info(`Suman test is exiting with code ${code}  ${extra}`);
    }
    else{
      _suman.log.info(chalk.bold(`Suman test is exiting with code ${code}  ${extra}`));
    }

    console.log('\n');
  }

  // if (typeof _suman.absoluteLastHook === 'function') {
  //   _suman.log.error('killing daemon process, using absolute last hook.');
  //   _suman.absoluteLastHook(code);
  // }

  // this is important, because we *can* change the exit code by using this call
  process.exitCode = code;
  // process.exit(code);

});

