'use strict';
import {IRunnerObj, IRunnerRunFn, IRunObj, ISumanChildProcess, ITableRows} from "suman-types/dts/runner";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";
import * as fs from "fs";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import {ChildProcess} from "child_process";
const cp = require('child_process');
const path = require('path');
import util = require('util');
const EE = require('events');

//npm
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
import {events} from 'suman-events';
import {ISumanCPMessages} from "./handle-multiple-processes";
import su = require('suman-utils');
import async = require('async');
const noFilesFoundError = require('../helpers/no-files-found-error');
import * as chalk from 'chalk';
import {IGanttData} from "./socket-cp-hash";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const runnerUtils = require('./runner-utils');
import {handleTestCoverageReporting} from './coverage-reporting';
const {constants} = require('../../config/suman-constants');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////////////////////////////////

export const makeOnExitFn = function (runnerObj: IRunnerObj, tableRows: ITableRows,
                                      messages: Array<ISumanCPMessages>, forkedCPs: Array<ISumanChildProcess>,
                                      beforeExitRunOncePost: Function, makeExit: Function) {

  return function (n: ISumanChildProcess, gd: IGanttData) {

    let weHaveBailed = function (code: number) {
      if (code > 0 && _suman.sumanOpts.bail) {
        return runnerObj.bailed = true;
      }
    };

    return function (code: number, signal: number) {

      n.dateEndedMillis = gd.endDate = Date.now();
      n.sumanExitCode = gd.sumanExitCode = code;
      n.removeAllListeners();

      const sumanOpts = _suman.sumanOpts;
      // handleBlocking gets initialized weirdly in runner.js, but we will deal for now
      const handleBlocking = runnerObj.handleBlocking;

      resultBroadcaster.emit(String(events.TEST_FILE_CHILD_PROCESS_EXITED), {
        testPath: n.testPath,
        exitCode: code
      });

      if (su.isSumanDebug() || su.vgt(5)) {
        _suman.log(chalk.black.bgYellow(`process given by => '${n.shortTestPath}' exited with code: ${code} `));
      }

      if (su.isSumanDebug()) {
        _suman.timeOfMostRecentExit = Date.now();
      }

      const originalExitCode = code;

      if (n.expectedExitCode !== undefined) {
        if (code === n.expectedExitCode) {
          code = 0;
        }
      }

      runnerObj.doneCount++;
      messages.push({code, signal});

      tableRows[n.shortTestPath].actualExitCode = n.expectedExitCode !== undefined ?
        (n.expectedExitCode + '/' + originalExitCode) : originalExitCode;

      if ((weHaveBailed(code) || (runnerObj.doneCount >= forkedCPs.length && runnerObj.queuedCPs.length < 1))) {

        if (runnerObj.bailed) {

          console.log('\n');
          _suman.logError(chalk.magenta('We have ' + chalk.red.bold('bailed') +
            ' the test runner because a child process experienced an error and exitted with a non-zero code.'));

          _suman.logError(chalk.magenta('Since we have bailed, Suman will send a SIGTERM signal ' +
            'to any outstanding child processes.'));

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
            _suman.log(chalk.gray.bold.underline(' All scheduled child processes have exited.'));
            console.log('\n');
          }
        }

        runnerObj.endTime = Date.now();
        runnerObj.listening = false;

        const onTAPOutputComplete = function () {

          const tasks = [
            beforeExitRunOncePost,
            handleTestCoverageReporting
          ] as any;

          async.parallel(tasks, function (err: IPseudoError) {
            err && _suman.logError(err.stack || err);
            makeExit(messages, {
              total: runnerObj.endTime - _suman.startTime,
              runner: runnerObj.endTime - runnerObj.startTime
            });
          });

        };

        if ('tapOutputIsComplete' in n) {
          if (n.tapOutputIsComplete === true) {
            process.nextTick(onTAPOutputComplete);
          }
          else {
            n.once('tap-output-is-complete', onTAPOutputComplete);
          }
        }
        else {
          process.nextTick(onTAPOutputComplete);
        }

      }

    }
  }
};
