'use strict';

//dts
import {IGlobalSumanObj} from "../../../suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import EE = require('events');

//npm
import chalk from 'chalk';
const {events} = require('suman-events');
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = global.__suman || {};
const resultBroadcaster = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();

////////////////////////////////////////////////////////////////////////////////////////

export const onExit = function (code: number) {

  if (code > 0) {
    //make a beep noise if a failing run
    resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE_GREATER_THAN_ZERO), code);
  }
  else {
    resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE_IS_ZERO));
  }

  if (code > 0) {

    const logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
    const sumanCPLogs = path.resolve(logsDir + '/runs/');

    const logsPath = path.resolve(sumanCPLogs + '/' + _suman.timestamp + '-' + _suman.runId);
    console.log('\n', ' => At least one test experienced an error => View the test logs => ',
      '\n', chalk.yellow.bold(logsPath), '\n');
  }

  resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE), code);

  //write synchronously to ensure it gets written
  fs.appendFileSync(_suman.sumanRunnerStderrStreamPath, '\n\n### Suman runner end ###\n\n');

};
