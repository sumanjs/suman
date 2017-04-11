'use strict';

//core
const fs = require('fs');
const path = require('path');

//npm
const colors = require('colors/safe');
const events = require('suman-events');
const sumanUtils = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

////////////////////////////////////////////////////////////////////////////////////////

module.exports = function onExit(code) {

  if (code > 0) {
    //make a beep noise if a failing run
    // resultBroadcaster.emit('exit-code-greater-than-zero', '\007');
    resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE_GREATER_THAN_ZERO), code);
  }
  else {
    resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE_IS_ZERO));
  }

  if (code > 0) {
    const logsPath = path.resolve(_suman.sumanHelperDirRoot + '/logs/runs/' + _suman.timestamp + '-' + _suman.runId);
    console.log('\n', ' => At least one test experienced an error => View the test logs => ',
      '\n', colors.yellow.bold(logsPath),'\n');
  }

  resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE), code);

  //write synchronously to ensure it gets written
  fs.appendFileSync(_suman.sumanRunnerStderrStreamPath, '\n\n\n### Suman runner end ###\n\n\n\n\n\n\n');

};
