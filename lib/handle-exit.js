'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');
const fs = require('fs');
const assert = require('assert');

//npm
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../config/suman-constants');
const testErrors = global.testErrors = global.testErrors || [];
const errors = global.sumanRuntimeErrors = global.sumanRuntimeErrors || [];

////////////////////////////////////////////////////////////////////

process.once('exit', function (code, signal) {

  if (errors.length > 0) {
    code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
    errors.forEach(function (e) {
      if (global.usingRunner) {
        process.stderr.write(typeof e === 'string' ? e : util.inspect(e.stack || e));
      }
      if (global._writeTestError) {
        global._writeTestError(typeof e === 'string' ? e : util.inspect(e.stack || e));
      }

    });
  }
  else if (testErrors.length > 0) {
    code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
  }

  if (global._writeTestError) {
    global._writeTestError('\n\n ### Suman end run ### \n\n\n\n', {suppress: true});
  }

  if (global._writeLog) {
    if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
      global._writeLog('\n\n\ [ end of Suman run in SUMAN_SINGLE_PROCESS mode ]');
    }
    else {
      global._writeLog('\n\n\ [ end of Suman individual test run for file => "' + global._currentModule + '" ]');
    }
  }

  if (code > 0 && testErrors.length < 1) {   //TODO: fix this with logic saying if code > 0 and code < 60 or something
    if (!global.usingRunner) { //TODO: need to fix this
      process.stdout.write('\n\n =>' + colors.bgYellow.underline.bold.gray(' Suman test process experienced a fatal error during the run, ' +
          'most likely the majority of tests, if not all tests, were not run.') + '\n');
    }
  }

  if (global.checkTestErrorLog) {
    process.stdout.write('\n\n =>' + colors.bgYellow.underline.bold.gray(' You have some additional errors/warnings - check the test debug log ' +
        '(<suman-helpers-dir>/logs/test-debug.log) for more information.') + '\n');
  }

  if (Number.isInteger(global.expectedExitCode)) {
    if (code !== global.expectedExitCode) {
      global._writeTestError(' => Expected exit code not met. Expected => '
        + global.expectedExitCode + ', actual => ' + code);
      code = constants.EXIT_CODES.EXPECTED_EXIT_CODE_NOT_MET;
    }
    else {
      console.log('\n');
      console.log(colors.bgBlack.green(' => Expected exit code was met. '));
      console.log(colors.bgBlack.green(' => Expected exit code was => ', code,' '));
      console.log(colors.bgBlack.green(' => Because the expected exit code was met, we will exit with code 0. '));
      code = 0;
    }
  }

  if (!global.usingRunner) {

    let extra = '';
    if (code > 0) {
      extra = ' => see http://sumanjs.github.io/exit-codes.html';
    }

    console.log('\n');
    if(false){
      console.log(' => Total time => suman.init() -> process.exit() => ', (Date.now() - global.sumanInitTime));
    }

    let start;
    if(start = process.env.SUMAN_START_TIME){
      //SUMAN_START_TIME=$(node -e 'console.log(Date.now())')
      console.log(' => Absolute total time => ', (Date.now() - start));
    }
    console.log(' => Suman test is exiting with code ' + code + ' ', extra);
    console.log('\n');
  }

  process.exit(code);

});

