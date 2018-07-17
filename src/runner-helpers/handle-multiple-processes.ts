'use strict';

//dts
import {IRunnerObj, IRunnerRunFn, IRunObj, ISumanChildProcess, ITableRows} from "suman-types/dts/runner";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
const shuffle = require('lodash.shuffle');
import {events} from 'suman-events';
import * as su from 'suman-utils';
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import {cpHash, socketHash, ganttHash, IGanttHash, IGanttData} from './socket-cp-hash';
import {makeAddToTranspileQueue} from './multi-process/add-to-transpile-queue';
import {makeOnExitFn} from './multiple-process-each-on-exit';
import {makeAddToRunQueue} from "./multi-process/add-to-run-queue";
import {makeRunQueue, makeTranspileQueue} from "./shared/queues";

/////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ISumanCPMessages {
  code: number,
  signal: any
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeHandleMultipleProcesses = function (runnerObj: IRunnerObj, tableRows: ITableRows,
                                                     messages: Array<ISumanCPMessages>,
                                                     forkedCPs: Array<ISumanChildProcess>,
                                                     beforeExitRunOncePost: Function, makeExit: Function): Function {

  return function (runObj: IRunObj) {

    const {sumanOpts, sumanConfig, projectRoot} = _suman;
    _suman.startDateMillis = Date.now();
    process.stderr.setMaxListeners(runObj.files.length + 11);
    process.stdout.setMaxListeners(runObj.files.length + 11);

    const logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
    const sumanCPLogs = path.resolve(logsDir + '/runs/');
    const f = path.resolve(sumanCPLogs + '/' + _suman.timestamp + '-' + _suman.runId);
    const args: Array<string> = ['--user-args', sumanOpts.user_args];
    const runQueue = makeRunQueue();
    const onExitFn = makeOnExitFn(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, runQueue);
    const runFile = makeAddToRunQueue(runnerObj, args, runQueue, projectRoot, cpHash, forkedCPs, onExitFn);

    const waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;
    if (waitForAllTranformsToFinish) {
      _suman.log.info('waitForAllTranformsToFinish => ', chalk.magenta(waitForAllTranformsToFinish));
    }

    let queuedTestFns: Array<Function> = [];
    let failedTransformObjects: Array<Object> = [];

    const transpileQueue = makeTranspileQueue(failedTransformObjects, runFile, queuedTestFns);

    if (waitForAllTranformsToFinish) {
      transpileQueue.drain = function () {
        // => execute all queued tests
        _suman.log.info('all transforms complete, beginning to run first set of tests.');
        queuedTestFns.forEach(function (fn) {
          fn();
        });
      }
    }

    if (sumanOpts.$useTAPOutput) {
      if (sumanOpts.verbosity > 4) {
        _suman.log.info(chalk.gray.bold('Suman runner is expecting TAP output from Node.js child processes ' +
          'and will not be listening for websocket messages.'));
      }
    }

    let files = runObj.files;

    //TODO: need to remove duplicate files before calling resultBroadcaster
    resultBroadcaster.emit(String(events.RUNNER_STARTED), files.length);

    if (_suman.sumanOpts.rand) {
      files = shuffle(files);
    }

    runnerObj.startTime = Date.now();
    const fileObjArray = su.removeSharedRootPath(files);

    // add all files to transpile queuq
    fileObjArray.forEach(makeAddToTranspileQueue(f, transpileQueue, tableRows, ganttHash, projectRoot));

  }

};
