'use strict';
import {IRunnerObj, IRunnerRunFn, IRunObj, ISumanChildProcess, ITableRows} from "../../dts/runner";
import {IPseudoError} from "../../dts/global";
import * as fs from "fs";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import {ChildProcess} from "child_process";
const cp = require('child_process');
const path = require('path');
const util = require('util');
const EE = require('events');

//npm
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
import {events} from 'suman-events';
import {ISumanCPMessages} from "./handle-multiple-processes";
const su = require('suman-utils');
const async = require('async');
const noFilesFoundError = require('../helpers/no-files-found-error');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const runnerUtils = require('./runner-utils');
const {constants} = require('../../config/suman-constants');
const debug = require('suman-debug')('s:runner');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());


export default function (n: ISumanChildProcess,runnerObj: IRunnerObj, tableRows: ITableRows,
                         messages: Array<ISumanCPMessages>, forkedCPs: Array<ISumanChildProcess>,
                         beforeExitRunOncePost: Function, makeExit: Function) {

  return function (code: number, signal: number) {

    const sumanOpts = _suman.sumanOpts;
    // handleBlocking gets initialized weirdly in runner.js, but we will deal for now
    const handleBlocking = runnerObj.handleBlocking;

    resultBroadcaster.emit(String(events.TEST_FILE_CHILD_PROCESS_EXITED), {
      testPath: n.testPath,
      exitCode: code
    });

    if (su.isSumanDebug() || su.vgt(5)) {
      console.log('\n',
        colors.black.bgYellow(' => process given by => ' +
          n.shortTestPath + ' exited with code: ' + code + ' '), '\n');
    }

    if (su.isSumanDebug()) {
      _suman.timeOfMostRecentExit = Date.now();
    }

    n.removeAllListeners();

    const originalExitCode = JSON.parse(JSON.stringify(code));

    if (n.expectedExitCode !== undefined) {
      if (code === n.expectedExitCode) {
        code = 0;
      }
    }

    runnerObj.doneCount++;
    messages.push({code: code, signal: signal});
    tableRows[n.shortTestPath].actualExitCode = n.expectedExitCode !== undefined ?
      (n.expectedExitCode + '/' + originalExitCode) : originalExitCode;

    //TODO: if bail, need to make that clear to user here
    if ((runnerObj.bailed = (code > 0 && _suman.sumanOpts.bail)) ||
      (runnerObj.doneCount >= forkedCPs.length && runnerObj.queuedCPs.length < 1)) {

      if (runnerObj.bailed) {
        console.log('\n\n');
        console.log(colors.magenta(' => Suman warning message => ' +
          'We have ' + colors.red.bold('bailed') + ' the test runner because a child process experienced an error ' +
          'and exitted with a non-zero code.'));
        console.log(' => Since we have bailed, Suman will send a SIGTERM signal to any outstanding child processes.');
        forkedCPs.forEach(function (n: ISumanChildProcess) {
          n.kill('SIGTERM');
          setTimeout(function () {
            n.kill('SIGKILL');
          }, 3000);
        });
      }
      else {

        if (sumanOpts.verbosity > 4) {
          console.log('\n');
          _suman.log(colors.blue.bold.underline(' All scheduled child processes have exited.'));
          console.log('\n');
        }
      }

      runnerObj.endTime = Date.now();
      runnerObj.listening = false;

      const waitForTAP = function () {
        async.parallel([
          beforeExitRunOncePost,
          function (cb: Function) {
            if (_suman.sumanOpts.coverage && !_suman.sumanOpts.no_report) {
              console.log('\n');
              console.log(colors.blue.bold(' => Suman is running the Istanbul collated report.'));
              console.log(colors.blue.bold(' => To disable automatic report generation, use "--no-coverage-report".'));
              let coverageDir = path.resolve(_suman.projectRoot + '/coverage');
              const k = cp.spawn(_suman.istanbulExecPath,
                ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'], {
                  cwd: _suman.projectRoot
                });

              // k.stdout.pipe(process.stdout);
              k.stderr.pipe(process.stderr);

              k.once('close', function (code: number) {
                k.unref();
                cb(code ? new Error(' => Test coverage exitted with non-zero exit code') : null, code);
              });
            }
            else {
              process.nextTick(cb);
            }

          }

        ], function (err: IPseudoError) {
          if (err) {
            console.error(err.stack || err);
          }

          makeExit(messages, {
            total: runnerObj.endTime - _suman.startTime,
            runner: runnerObj.endTime - runnerObj.startTime
          });
        });
      };

      if ('tapOutputIsComplete' in n) {
        if (n.tapOutputIsComplete === true) {
          process.nextTick(waitForTAP);
        }
        else {
          n.once('tap-output-is-complete', waitForTAP);
        }
      }
      else {
        process.nextTick(waitForTAP);
      }

    }
    else {
      handleBlocking.releaseNextTests(n.testPath, runnerObj);
      if (su.isSumanDebug()) {
        console.log(' => Time required to release next test(s) => ',
          Date.now() - _suman.timeOfMostRecentExit, 'ms');
      }
    }

  }

}
