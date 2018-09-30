'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import cp = require('child_process');
import path = require('path');

//npm
import * as su from 'suman-utils';
import chalk from 'chalk';


//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////

export const handleTestCoverageReporting = function (cb: Function) {

  if (!_suman.sumanOpts.coverage || _suman.sumanOpts.no_report) {
    // do not need to generate a report, in this case
    return process.nextTick(cb);
  }

  console.log('\n');
  _suman.log.info(chalk.blue.bold('Suman is running the Istanbul collated report.'));
  _suman.log.info(chalk.blue.bold('To disable automatic report generation, use "--no-coverage-report".'));
  const coverageDir = path.resolve(_suman.projectRoot + '/coverage/suman_by_timestamp/' + _suman.timestamp);
  
  
  const args = ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'];
  // const args = ['report', '--dir', coverageDir, '--include', '**/*coverage.json'];
  
  const k = cp.spawn(_suman.istanbulExecPath || 'istanbul', args, {
    cwd: _suman.projectRoot
  });
  
  // const k = cp.spawn('nyc', ['report','--reporter=lcov'], {
  //   cwd: _suman.projectRoot
  // });
  
  // k.stdout.pipe(process.stdout);
  k.stderr.pipe(process.stderr);

  k.once('close', function (code: number) {
    k.unref();
    cb(code ? new Error(`Test coverage process exitted with non-zero exit code => "${code}".`) : null, code);
  });

};
