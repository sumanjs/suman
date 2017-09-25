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

  if (_suman.sumanOpts.coverage && !_suman.sumanOpts.no_report) {
    console.log('\n');
    _suman.log(chalk.blue.bold('Suman is running the Istanbul collated report.'));
    _suman.log(chalk.blue.bold('To disable automatic report generation, use "--no-coverage-report".'));
    let coverageDir = path.resolve(_suman.projectRoot + '/coverage');
    const k = cp.spawn(_suman.istanbulExecPath,
      ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'], {
        cwd: _suman.projectRoot
      });

    // k.stdout.pipe(process.stdout);
    k.stderr.pipe(process.stderr);

    k.once('close', function (code: number) {
      k.unref();
      cb(code ? new Error(`Test coverage process exitted with non-zero exit code => "${code}".`) : null, code);
    });
  }
  else {
    process.nextTick(cb);
  }

};
