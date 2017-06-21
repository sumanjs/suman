'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const parser = require('tap-parser');
import {events} from 'suman-events';
const EE = require('events');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

///////////////////////////////////////////////////////////////////////////

export = function getParser () {

  const p = parser();

  p.on('complete', function(data: string){
    resultBroadcaster.emit(String(events.TAP_COMPLETE), data);
  });

  p.on('assert', function (testpoint) {

    debugger;

    console.log('we are emitting TAP testpoint', util.inspect(testpoint));

    resultBroadcaster.emit(String(events.TEST_CASE_END), testpoint);

    if (testpoint.skip) {
      throw new Error('testpoint.skip');
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED), testpoint);
    }
    else if (testpoint.todo) {
      throw new Error('testpoint.todo/stubbed');
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




