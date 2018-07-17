'use strict';

//dts
import {IRunnerObj, ISumanChildProcess, ITableRows} from "suman-types/dts/runner";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

///////////////////////////////////////////////////

if (false) {
  // note: this is useful for detective work to find out what might be logging unncessarily
  // das interceptor!
  const stdout = process.stdout.write;
  process.stdout.write = function (data: String | Buffer) {
    stdout(new Error(String(data)).stack);
    stdout.apply(process.stdout, arguments);
  };

  const stderr = process.stderr.write;
  process.stderr.write = function (data: String | Buffer) {
    stderr(new Error(String(data)).stack);
    stderr.apply(process.stderr, arguments);
  };
}

///////////////////////////////////////////////////

//core
import os = require('os');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
const fnArgs = require('function-arguments');
const mapValues = require('lodash.mapvalues');
import chalk from 'chalk';
import {events} from 'suman-events';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import integrantInjector from '../injection/integrant-injector';
import {constants} from '../config/suman-constants';
import {ascii} from '../helpers/ascii';
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import {handleFatalMessage} from './handle-fatal-message';
import {logTestResult} from './log-test-result';
const {onExit} = require('./on-exit');
import {makeExit} from './make-exit';
import {makeHandleIntegrantInfo} from './handle-integrant-info';
import {makeBeforeExit} from './make-before-exit-once-post';
const makeSingleProcess = require('./handle-single-process');
const {makeContainerize} = require('./handle-containerize');
const {makeHandleBrowserProcesses} = require('./handle-browser');
import {makeHandleMultipleProcesses} from './handle-multiple-processes';
const IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
import {getSocketServer, initializeSocketServer} from './socketio-server';
import {cpHash, socketHash} from './socket-cp-hash';

//////////////////////////////////////////////////////////////////////////////////////

export interface IIntegrantHash {
  [key: string]: any
}

export interface IOncePost {
  [key: string]: Function | Array<string | Function>
}

export type TOncePostKeys = Array<Array<string>>

///////////////////////////////////////////////////////////////////////////////////////

const messages: Array<any> = [];
const oncePosts: IOncePost = {};
const allOncePostKeys: TOncePostKeys = [];
const tableRows: ITableRows = {};
const forkedCPs: Array<ISumanChildProcess> = [];

const runnerObj: IRunnerObj = {
  doneCount: 0,
  tableCount: 0,
  listening: true,
  processId: 1,
  startTime: null,
  endTime: null,
  bailed: false,
  queuedCPs: [],
  hasOncePostFile: false,
  innited: false,
  oncePostModule: null,
  oncePostModuleRet: null,
  depContainerObj: null,
  handleBlocking: null
};

const handleIntegrantInfo = makeHandleIntegrantInfo(runnerObj, allOncePostKeys);
const exit = makeExit(runnerObj, tableRows);
const beforeExitRunOncePost = makeBeforeExit(runnerObj, oncePosts, allOncePostKeys);

{
  //register exit here !
  _suman.isActualExitHandlerRegistered = true;
  process.once('exit', onExit);
}

process.on('error', function (e: IPseudoError) {
  _suman.log.error(`${chalk.magenta('Whoops! "error" event in runner process:')} \n ${chalk.bold(su.getCleanErrorString(e))}`);
});

process.once('uncaughtException', function (e: IPseudoError) {

  debugger; // leave debugger statement here please
  _suman.log.error(`${chalk.magenta('Suman runner "uncaughtException" event:')} \n ${chalk.bold(su.getCleanErrorString(e))}`);
  process.exit(1);
});

process.on('message', function (data: any) {

  debugger; // leave debugger statement here please
  _suman.log.error('Weird! => Suman runner received an IPC message:\n',
    chalk.magenta(typeof data === 'string' ? data : util.inspect(data)));
});

const INTEGRANT_INFO = constants.runner_message_type.INTEGRANT_INFO;
const TABLE_DATA = constants.runner_message_type.TABLE_DATA;
const LOG_RESULT = constants.runner_message_type.LOG_RESULT;
const FATAL = constants.runner_message_type.FATAL;
const FATAL_MESSAGE_RECEIVED = constants.runner_message_type.FATAL_MESSAGE_RECEIVED;
const BROWSER_FINISHED = constants.runner_message_type.BROWSER_FINISHED;

const handleTableData = function (n: ISumanChildProcess, data: any, s: SocketIOClient.Socket) {
  runnerObj.tableCount++;
  tableRows[n.shortTestPath].tableData = data;
  s.emit(TABLE_DATA, {info: 'table-data-received'});
};

export const run = function (runObj: Object, runOnce: Function, $order: Object) {

  debugger; // leave it here

  const {sumanOpts} = _suman;
  if (sumanOpts.errors_only) {
    rb.emit(String(events.ERRORS_ONLY_OPTION));
  }

  const server = getSocketServer();
  server.on('connection', function (socket: SocketIOClient.Socket) {

    socket.on(INTEGRANT_INFO, function (data: Object) {
      let id = data.childId;
      let n = cpHash[id];
      handleIntegrantInfo(data, n, socket)
    });

    socket.on(FATAL, function (msg: Object) {
      let id = msg.childId;
      let n = cpHash[id];
      socket.emit(FATAL_MESSAGE_RECEIVED, true);
      handleFatalMessage(msg.data, n, socket);
    });

    socket.on(TABLE_DATA, function (msg: Object) {
      let id = msg.childId;
      let n = cpHash[id];
      handleTableData(n, msg.data, socket);
    });

    socket.on(LOG_RESULT, function (msg: Object, cb: Function) {
      let id = msg.childId;
      let n = cpHash[id];
      logTestResult(msg, n, socket);
      cb(null);
    });

    socket.on(BROWSER_FINISHED, function (msg: Object, cb: Function) {
      let id = String(msg.childId).trim();
      let exitCode = Number(String(msg.exitCode).trim());

      let n = cpHash[id];

      n.sumanBrowserExitCode = exitCode;

      // try killing the child process 3 times.
      n.kill('SIGTERM');
      setTimeout(function () {
        if (!n.hasExited) {
          n.kill('SIGINT');
          setTimeout(function () {
            !n.hasExited && n.kill('SIGKILL');
          }, 1000);
        }
      }, 1000);

      cb(null);
    });

  });

  //need to get rid of this property so child processes cannot require Suman index file
  delete process.env.SUMAN_EXTRANEOUS_EXECUTABLE;

  process.nextTick(function () {

    const args: Array<string> = fnArgs(runOnce);
    const ret = runOnce.apply(null, integrantInjector(args, null));

    if (ret.dependencies) {
      if (su.isObject(ret.dependencies)) {
        runnerObj.depContainerObj = ret.dependencies;
      }
      else {
        throw new Error(' => suman.once.pre.js file does not export an object with a property called "dependencies".');
      }
    }
    else {
      _suman.log.error('warning, no dependencies object exported from suman.once.pre.js file => \n' +
        'here is the returned contents =>\n', util.inspect(ret));
    }

    rb.emit(String(events.RUNNER_ASCII_LOGO), ascii.suman_runner);

    let fn;

    if (IS_SUMAN_SINGLE_PROCESS) {
      fn = makeSingleProcess(runnerObj, messages, beforeExitRunOncePost, exit);
    }
    else if (sumanOpts.containerize) {
      fn = makeContainerize(runnerObj, messages, beforeExitRunOncePost, exit);
    }
    else if (sumanOpts.browser) {
      fn = makeHandleBrowserProcesses(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, exit);
    }
    else if (runObj) {
      fn = makeHandleMultipleProcesses(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, exit);
    }
    else {
      throw new Error('Suman implementation error => Switch fallthrough, please report.');
    }

    fn(runObj);

  });

};



