'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import su = require('suman-utils');
import chalk = require('chalk');

import parser from 'tap-json-parser';
import {events} from 'suman-events';
import EE = require('events');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

///////////////////////////////////////////////////////////////////////////

let first = true;

export const getTapJSONParser = function () {

  const p = parser();

  p.on('testpoint', function (testpoint: Object) {

    if (first) {
      first = false;
      console.log('\n');
      _suman.log.info(chalk.yellow.bold('suman runner has received first test result via TAP.'));
      console.log('\n');
    }

    resultBroadcaster.emit(String(events.TEST_CASE_END), testpoint);

    if (testpoint.skip) {
      // throw new Error('testpoint.skip');
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED), testpoint);
    }
    else if (testpoint.todo) {
      // throw new Error('testpoint.todo/stubbed');
      resultBroadcaster.emit(String(events.TEST_CASE_STUBBED), testpoint);
    }
    else if (testpoint.ok) {
      resultBroadcaster.emit(String(events.TEST_CASE_PASS), testpoint);
    }
    else {
      resultBroadcaster.emit(String(events.TEST_CASE_FAIL), testpoint);
    }
  });

  return p;

};




