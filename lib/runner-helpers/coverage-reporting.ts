'use strict';

//core
import cp = require('child_process');
import path = require('path');

//npm
import su from 'suman-utils';
import * as chalk from 'chalk';
import {IGlobalSumanObj} from "suman-types/dts/global";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////

export const handleTestCoverageReporting = function (cb: Function) {

  if (!_suman.sumanOpts.coverage || _suman.sumanOpts.no_report) {
    // do not need to generate a report, in this case
    return process.nextTick(cb);
  }

  console.log('\n');
  _suman.log(chalk.blue.bold('Suman is running the Istanbul collated report.'));
  _suman.log(chalk.blue.bold('To disable automatic report generation, use "--no-coverage-report".'));
  const coverageDir = path.resolve(_suman.projectRoot + '/coverage');
  const args = ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'];
  const k = cp.spawn(_suman.istanbulExecPath || 'istanbul', args, {
    cwd: _suman.projectRoot
  });

  // k.stdout.pipe(process.stdout);
  k.stderr.pipe(process.stderr);

  k.once('close', function (code: number) {
    k.unref();
    cb(code ? new Error(`Test coverage process exitted with non-zero exit code => "${code}".`) : null, code);
  });

};
