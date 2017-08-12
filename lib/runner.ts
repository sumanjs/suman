'use strict';
import {IRunnerObj, ISumanChildProcess, ITableRows} from "../dts/runner";
import {IGlobalSumanObj, IPseudoError} from "../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

/////////////////////////////////////////////////////

const slicedArgs = process.argv.slice(2);
const execArgs = process.execArgv.slice(0);

//////////////////////////////////////////////////////////

const weAreDebugging = require('./helpers/we-are-debugging');

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
import * as chalk from 'chalk';

const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;
import {events} from 'suman-events';
import su from 'suman-utils';

const debug = require('suman-debug')('s:runner');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import integrantInjector from './injection/integrant-injector';
import {constants} from '../config/suman-constants';

const ascii = require('./helpers/ascii');
import makeHandleBlocking from './runner-helpers/make-handle-blocking';

const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const handleFatalMessage = require('./runner-helpers/handle-fatal-message');
import {logTestResult} from './runner-helpers/log-test-result';

const {onExit} = require('./runner-helpers/on-exit');
import {makeExit} from './runner-helpers/make-exit';

const {makeHandleIntegrantInfo} = require('./runner-helpers/handle-integrant-info');
import {makeBeforeExit} from './runner-helpers/make-before-exit-once-post';

const makeSingleProcess = require('./runner-helpers/handle-single-process');
const {makeContainerize} = require('./runner-helpers/handle-containerize');
import {makeHandleMultipleProcesses} from './runner-helpers/handle-multiple-processes';

const IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
import {getSocketServer, initializeSocketServer} from './runner-helpers/socketio-server';
import {cpHash, socketHash} from './runner-helpers/socket-cp-hash';

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
global.__suman.isActualExitHandlerRegistered = true;
process.once('exit', onExit);

process.on('error', function (err: IPseudoError) {
  //TODO: add process.exit(special code);
  console.error(' => Whoops! Error in runner process :\n', err.stack || err);
});

process.once('uncaughtException', function (e: IPseudoError) {
  //TODO: add process.exit(special code);
  console.error('\n\n => Suman runner uncaughtException...\n', e.stack || e);
  process.exit(1);
});

process.on('message', function (data: any) {
  //TODO: add process.exit(special code);
  console.error(' => Weird! => Suman runner received a message:',
    (typeof data === 'string' ? data : util.inspect(data)));
});

const server = getSocketServer();
const INTEGRANT_INFO = constants.runner_message_type.INTEGRANT_INFO;
const TABLE_DATA = constants.runner_message_type.TABLE_DATA;
const LOG_RESULT = constants.runner_message_type.LOG_RESULT;
const FATAL = constants.runner_message_type.FATAL;
const FATAL_MESSAGE_RECEIVED = constants.runner_message_type.FATAL_MESSAGE_RECEIVED;

function handleTableData(n: ISumanChildProcess, data: any, s: SocketIOClient.Socket) {
  runnerObj.tableCount++;
  tableRows[n.shortTestPath].tableData = data;

  s.emit(TABLE_DATA, {
    info: 'table-data-received'
  });

}

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

  socket.on(LOG_RESULT, function (msg: Object) {
    let id = msg.childId;
    let n = cpHash[id];
    logTestResult(msg, n, socket);
  });

});

function handleMessageForSingleProcess(msg: Object, n: ISumanChildProcess) {

  switch (msg.type) {

    case constants.runner_message_type.TABLE_DATA:
      // handleTableData(n, msg.data);
      break;

    case constants.runner_message_type.INTEGRANT_INFO:
      handleIntegrantInfo(msg, n);
      break;
    case constants.runner_message_type.LOG_RESULT:
      logTestResult(msg, n);
      break;
    case constants.runner_message_type.FATAL:
      n.send({info: 'fatal-message-received'});
      //TODO: need to make sure this is only called once per file
      handleFatalMessage(msg.data, n);
      break;
    case constants.runner_message_type.NON_FATAL_ERR:
      console.error('\n\n ' + chalk.red('non-fatal suite error: ' + msg.msg + '\n'));
      break;
    case constants.runner_message_type.MAX_MEMORY:
      console.log('\nmax memory: ' + util.inspect(msg.msg));
      break;
    default:
      throw new Error(' => Suman internal error => bad msg.type in runner');
  }
}

function handleMessage(msg: Object, n: ISumanChildProcess) {

  switch (msg.type) {
    case constants.runner_message_type.TABLE_DATA:
      handleTableData(n, msg.data);
      break;
    case constants.runner_message_type.INTEGRANT_INFO:
      handleIntegrantInfo(msg, n);
      break;
    case constants.runner_message_type.LOG_RESULT:
      logTestResult(msg, n);
      break;
    case constants.runner_message_type.FATAL:
      n.send({info: 'fatal-message-received'});
      handleFatalMessage(msg.data, n);
      break;
    case constants.runner_message_type.WARNING:
      console.error('\n\n ' + chalk.bgYellow('Suman warning: ' + msg.msg + '\n'));
      break;
    case constants.runner_message_type.NON_FATAL_ERR:
      console.error('\n\n ' + chalk.red('non-fatal suite error: ' + msg.msg + '\n'));
      break;
    default:
      throw new Error(' => Suman implementation error => Bad msg.type in runner, perhaps the user sent a message with process.send?');
  }
}

const runSingleOrMultipleDirs =
  makeHandleMultipleProcesses(runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, exit);

const runAllTestsInSingleProcess =
  makeSingleProcess(runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, exit);

const runAllTestsInContainer =
  makeContainerize(runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, exit);

///////////////

export const findTestsAndRunThem = function (runObj: Object, runOnce: Function, $order: Object) {

  debugger; // leave it here

  if (_suman.sumanOpts.errors_only) {
    resultBroadcaster.emit(String(events.ERRORS_ONLY_OPTION));
  }

  //need to get rid of this property so child processes cannot require Suman index file
  delete process.env.SUMAN_EXTRANEOUS_EXECUTABLE;

  const projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd());

  runnerObj.handleBlocking = makeHandleBlocking(mapValues($order, function (val) {
    val.testPath = path.resolve(projectRoot + '/' + val.testPath);
    return val;
  }));

  process.nextTick(function () {

    const args: Array<string> = fnArgs(runOnce);
    const ret = runOnce.apply(null, integrantInjector(args));

    if (ret.dependencies) {
      if (su.isObject(ret.dependencies)) {
        runnerObj.depContainerObj = ret.dependencies;
      }
      else {
        throw new Error(' => suman.once.pre.js file does not export an object with a property called "dependencies".');
      }
    }
    else {
      _suman.logError('warning, no dependencies object exported from suman.once.pre.js file => \n' +
        'here is the returned contents =>\n', util.inspect(ret));
    }

    resultBroadcaster.emit(String(events.RUNNER_ASCII_LOGO), ascii.suman_runner);

    if (IS_SUMAN_SINGLE_PROCESS) {
      runAllTestsInSingleProcess(runObj);
    }
    else if (_suman.sumanOpts.containerize) {
      runAllTestsInContainer(runObj);
    }
    else if (runObj) {
      runSingleOrMultipleDirs(runObj);
    }
    else {
      throw new Error(' => Suman implementation error => Please report.');
    }

  });

};

const $exports = module.exports;
export default $exports;


