'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ISumanChildProcess} from "suman-types/dts/runner";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import {events} from 'suman-events';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////

export const logTestResult = function (data, n: ISumanChildProcess) {

  const test = data.test;

  resultBroadcaster.emit(String(events.TEST_CASE_END), test);

  if (test.errorDisplay) {
    resultBroadcaster.emit(String(events.TEST_CASE_FAIL), test);
  }
  else {

    if (test.skipped) {
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED), test);
    }
    else if (test.stubbed) {
      resultBroadcaster.emit(String(events.TEST_CASE_STUBBED), test);
    }
    else {
      resultBroadcaster.emit(String(events.TEST_CASE_PASS), test);
    }
  }
};
