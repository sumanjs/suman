'use strict';

//dts
import {IRunnerObj, IRunnerRunFn, IRunObj, ISumanChildProcess, ITableRows} from "suman-types/dts/runner";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

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
import chalk from 'chalk';
import {IGanttData} from "./socket-cp-hash";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {handleTestCoverageReporting} from './coverage-reporting';
import {getTranspileQueue, getRunQueue} from './shared/queues';
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeOnExitFn = function (runnerObj: IRunnerObj, tableRows: ITableRows,
                                      messages: Array<ISumanCPMessages>, forkedCPs: Array<ISumanChildProcess>,
                                      beforeExitRunOncePost: Function, makeExit: Function, runQueue: any) {

  return function (n: ISumanChildProcess, gd: IGanttData, cb: Function) {

    let weHaveBailed = function (code: number) {
      if (code > 0 && _suman.sumanOpts.bail) {
        return runnerObj.bailed = true;
      }
    };

    let allDone = function (q: Object) {
      return q && q.length() < 1 && q.running() < 1;
    };

    return function (code: number, signal: number) {

      n.hasExitted = n.exited = true;
      cb(null);  // fire run queue callback

      n.dateEndedMillis = gd.endDate = Date.now();
      n.sumanExitCode = gd.sumanExitCode = code = (n.sumanBrowserExitCode || code);
      n.removeAllListeners();

      const sumanOpts = _suman.sumanOpts;
      const transpileQueue = getTranspileQueue();

      rb.emit(String(events.TEST_FILE_CHILD_PROCESS_EXITED), {
        testPath: n.testPath,
        exitCode: code
      });

      if (su.isSumanDebug() || su.vgt(5)) {
        _suman.log.info(chalk.black.bgYellow(`process given by => '${n.shortTestPath}' exited with code: ${code} `));
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

      // console.log('transpileQ:', util.inspect(transpileQueue));

      if (weHaveBailed(code) || (allDone(runQueue) && allDone(transpileQueue))) {

        if (runnerObj.bailed) {

          runQueue.kill();
          transpileQueue.kill();

          console.log('\n');
          _suman.log.error(chalk.magenta('We have ' + chalk.red.bold('bailed') +
            ' the test runner because a child process experienced an error and exitted with a non-zero code.'));

          _suman.log.error(chalk.magenta('Since we have bailed, Suman will send a SIGTERM signal ' +
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
            _suman.log.info(chalk.gray.bold.underline(' All scheduled child processes have exited.'));
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
            err && _suman.log.error(err.stack || err);
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
