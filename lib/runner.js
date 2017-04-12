'use strict';

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
  process.stdout.write = function (data) {
    stdout(new Error(String(data)).stack);
    stdout.apply(process.stdout, arguments);
  };

  const stderr = process.stderr.write;
  process.stderr.write = function (data) {
    stderr(new Error(String(data)).stack);
    stderr.apply(process.stderr, arguments);
  };
}

///////////////////////////////////////////////////

//core
const assert = require('assert');
const util = require('util');
const EE = require('events');
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const os = require('os');
const domain = require('domain');

//npm
const async = require('async');
const mapValues = require('lodash.mapvalues');
const readline = require('readline');
const colors = require('colors/safe');
const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;
const makeBeep = require('make-beep');
const events = require('suman-events');
const debug = require('suman-debug')('s:runner');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../config/suman-constants');
const ascii = require('./helpers/ascii');
const sumanUtils = require('suman-utils');
const makeHandleBlocking = require('./runner-helpers/make-handle-blocking');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const handleFatalMessage = require('./runner-helpers/handle-fatal-message');
const logTestResult = require('./runner-helpers/log-test-result');
const onExit = require('./runner-helpers/on-exit');
const makeMakeExit = require('./runner-helpers/make-exit');
const makeHandleIntegrantInfo = require('./runner-helpers/handle-integrant-info');
const makeBeforeExit = require('./runner-helpers/make-before-exit-once-post');
const makeSingleProcess = require('./runner-helpers/handle-single-process');
const makeHandleMultipleProcesses = require('./runner-helpers/handle-multiple-processes');

//////////////////////////////////////////////

const cwd = process.cwd();
const projectRoot = _suman.projectRoot = _suman.projectRoot || sumanUtils.findProjectRoot(cwd);
const messages = [];
const integrantHash = {};
const integrantHashKeyValsForSumanOncePost = {};
const userData = {}; // user will send data to runner for any/all tests, once before they exit
const config = _suman.sumanConfig;
const oncePosts = {};
const allOncePostKeys = [];
const tableRows = {};
const forkedCPs = [];

const runnerObj = {
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
  handleBlocking: null,
  depContainerObj: null
};

const handleIntegrantInfo =
  makeHandleIntegrantInfo(runnerObj, allOncePostKeys, integrantHash, integrantHashKeyValsForSumanOncePost);
const makeExit =
  makeMakeExit(runnerObj, tableRows);
const beforeExitRunOncePost =
  makeBeforeExit(runnerObj, oncePosts, integrantHashKeyValsForSumanOncePost, allOncePostKeys, userData);



process.once('exit', onExit);


process.on('error', function (err) {
  //TODO: add process.exit(special code);
  console.error(' => Whoops! Error in runner process :\n', err.stack || err);
});

process.on('uncaughtException', function (e) {
  //TODO: add process.exit(special code);
  console.error('\n\n => Suman runner uncaughtException...\n', e.stack || e);
});

process.on('message', function (data) {
  //TODO: add process.exit(special code);
  console.error(' => Danger! => Suman runner received a message:',
    (typeof data === 'string' ? data : util.inspect(data)));
});


function handleTableData (n, data) {
  runnerObj.tableCount++;
  tableRows[n.shortTestPath].tableData = data;
  n.send({
    info: 'table-data-received'
  });
}

function logTestData (data) {

  // if (setup.usingLiveSumanServer) {
  //     networkLog.sendTestData(data);
  // }
  // else {

  throw new Error('this should not be used currently');

  //TODO: fix this
  let json = JSON.stringify(data.test);

  if (data.outputPath) {
    // console.log('data from test:',json);
    //sync call so that writes don't get corrupted
    fs.appendFileSync(data.outputPath, json += ',');
  }
  else {
    throw new Error('not outputPath...!');
  }
  // }

}

function handleMessageForSingleProcess (msg, n) {

  switch (msg.type) {

    case constants.runner_message_type.TABLE_DATA:
      // handleTableData(n, msg.data);
      break;

    //TODO: shouldn't integrants for single process be handled differently than multi-process?
    case constants.runner_message_type.INTEGRANT_INFO:
      handleIntegrantInfo(msg, n);
      break;
    case constants.runner_message_type.LOG_DATA:
      logTestData(msg);
      break;
    case constants.runner_message_type.LOG_RESULT:
      logTestResult(msg, n);
      break;
    case constants.runner_message_type.FATAL_SOFT:
      console.error('\n\n' + colors.grey(' => Suman warning => ') + colors.magenta(msg.msg) + '\n');
      break;
    case constants.runner_message_type.FATAL:
      n.send({info: 'fatal-message-received'});
      //TODO: need to make sure this is only called once per file
      handleFatalMessage(msg.data, n);
      break;
    case constants.runner_message_type.WARNING:
      console.error('\n\n ' + colors.bgYellow('Suman warning: ' + msg.msg + '\n'));
      break;
    case constants.runner_message_type.NON_FATAL_ERR:
      console.error('\n\n ' + colors.red('non-fatal suite error: ' + msg.msg + '\n'));
      break;
    case constants.runner_message_type.CONSOLE_LOG:
      console.log(msg.msg);
      break;
    case constants.runner_message_type.MAX_MEMORY:
      console.log('\nmax memory: ' + util.inspect(msg.msg));
      break;
    default:
      throw new Error(' => Suman internal error => bad msg.type in runner');
  }
}

function handleMessage (msg, n) {

  switch (msg.type) {

    case constants.runner_message_type.TABLE_DATA:
      handleTableData(n, msg.data);
      break;
    case constants.runner_message_type.INTEGRANT_INFO:
      handleIntegrantInfo(msg, n);
      break;
    case constants.runner_message_type.LOG_DATA:
      logTestData(msg);
      break;
    case constants.runner_message_type.LOG_RESULT:
      logTestResult(msg, n);
      break;
    case constants.runner_message_type.FATAL_SOFT:
      console.error('\n\n' + colors.grey(' => Suman warning => ') + colors.magenta(msg.msg) + '\n');
      break;
    case constants.runner_message_type.FATAL:
      n.send({info: 'fatal-message-received'});
      handleFatalMessage(msg.data, n);
      break;
    case constants.runner_message_type.WARNING:
      console.error('\n\n ' + colors.bgYellow('Suman warning: ' + msg.msg + '\n'));
      break;
    case constants.runner_message_type.NON_FATAL_ERR:
      console.error('\n\n ' + colors.red('non-fatal suite error: ' + msg.msg + '\n'));
      break;
    case constants.runner_message_type.CONSOLE_LOG:
      console.log(msg.msg);
      break;
    case constants.runner_message_type.MAX_MEMORY:
      console.log('\n => Max memory: ' + util.inspect(msg.msg));
      break;
    default:
      throw new Error(' => Suman implementation error => Bad msg.type in runner, perhaps the user sent a message with process.send?');
  }

}

const runSingleOrMultipleDirs =
  makeHandleMultipleProcesses(runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit);

const runAllTestsInSingleProcess =
  makeSingleProcess(runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, makeExit);


///////////////

function findTestsAndRunThem (runObj, runOnce, $order) {

  debugger; // leave it here

  if (_suman.sumanOpts.errors_only) {
    resultBroadcaster.emit(String(events.ERRORS_ONLY_OPTION));
  }

  //need to get rid of this property so child processes cannot require Suman index file
  delete process.env.SUMAN_EXTRANEOUS_EXECUTABLE;

  runnerObj.handleBlocking = makeHandleBlocking(mapValues($order, function (val) {
    val.testPath = path.resolve(projectRoot + '/' + val.testPath);
    return val;
  }));

  process.nextTick(function () {

    runnerObj.depContainerObj = runOnce();  //TODO: should this be done before this point in the program?
    resultBroadcaster.emit(String(events.RUNNER_ASCII_LOGO), ascii.suman_runner);

    if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
      runAllTestsInSingleProcess(runObj);
    }
    else if (runObj) {
      runSingleOrMultipleDirs(runObj);
    }
    else {
      throw new Error(' => Suman implementation error => Please report.');
    }

  });

}

module.exports = findTestsAndRunThem;


