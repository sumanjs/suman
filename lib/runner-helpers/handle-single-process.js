'use strict';

//core
const cp = require('child_process');
const path = require('path');

//npm
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
const events = require('suman-events');
const sumanUtils = require('suman-utils');

//project
const handleTap = require('./handle-tap');
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////


module.exports = function(runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, makeExit){

  return function runAllTestsInSingleProcess (runObj) {

    const args = [];
    let files = runObj.files;

    if (global.sumanOpts.rand) {
      files = shuffle(files);
    }

    const $files = sumanUtils.removeSharedRootPath(files);
    const SUMAN_SINGLE_PROCESS_FILES = JSON.stringify($files);

    const toPrint = $files.map(function (f) {
      return ' => ' + f[1];
    });

    toPrint.unshift('');
    toPrint.push('');
    toPrint.push('');
    toPrint.push('');  // add some vertical padding

    console.log(' => Suman files running in single process =>\n', toPrint.join('\n\t'));
    runnerObj.startTime = Date.now();

    const sumanEnv = Object.assign({}, process.env, {
      SUMAN_CONFIG: JSON.stringify(global.sumanConfig),
      SUMAN_OPTS: JSON.stringify(global.sumanOpts),
      SUMAN_SINGLE_PROCESS_FILES: SUMAN_SINGLE_PROCESS_FILES,
      SUMAN_SINGLE_PROCESS: 'yes',
      SUMAN_RUNNER: 'yes',
      SUMAN_RUN_ID: _suman.runId,
      SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
      NPM_COLORS: process.env.NPM_COLORS || (global.sumanOpts.no_colors ? 'no' : 'yes')
    });

    if (global.sumanOpts.register) {
      args.push('--register');
    }

    const execArgz = ['--expose-gc', '--harmony', '--expose_debug_as=v8debug'];

    if (weAreDebugging) {
      if (!global.sumanOpts.ignore_break) {  //NOTE: this allows us to focus on debugging runner
        execArgz.push('--debug-brk');
      }
      execArgz.push('--debug=' + (5303 + runnerObj.processId++));
    }

    const ext = merge({}, {
      cwd: projectRoot,  //TODO: improve this logic
      silent: !(global.sumanOpts.no_silent === true),
      execArgv: execArgz,
      env: sumanEnv,
      detached: false   //TODO: detached:false works but not true
    });

    const n = cp.fork(path.resolve(__dirname + '/run-child.js'), args, ext);

    //TODO: n.testPath is not defined, have to mititage this so that logic still works

    n.on('message', function (msg) {
      handleMessageForSingleProcess(msg, n);
    });

    n.on('error', function (err) {
      throw new Error(err.stack);
    });

    if (global.sumanOpts.no_silent !== true) {

      n.stdio[2].setEncoding('utf-8');
      n.stdio[2].on('data', function (data) {

        const d = String(data).split('\n').map(function (line) {
          return '[' + '???' + '] ' + line;
        }).join('\n');

        global.sumanStderrStream.write('\n\n');
        global.sumanStderrStream.write(d);

        if (weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
          //TODO: go through code and make sure that no console.log statements should in fact be console.error
          console.log('pid => ', n.pid, 'stderr => ', d);
        }

      });

    }

    n.once('exit', function (code, signal) {

      if (process.env.SUMAN_DEBUG === 'yes') {
        console.log('\n', colors.black.bgYellow(' => process given by => ' + n.shortTestPath + ' exited with code: ' + code + ' '), '\n');
      }

      if (process.env.SUMAN_DEBUG === 'yes') {
        global.timeOfMostRecentExit = Date.now();
      }

      n.removeAllListeners();

      runnerObj.doneCount++;
      messages.push({code: code, signal: signal});

      runnerObj.listening = false;
      setImmediate(function () {
        beforeExitRunOncePost(function (err) {
          makeExit(messages, Date.now() - runnerObj.startTime);
        });
      });

    });

  }

};
