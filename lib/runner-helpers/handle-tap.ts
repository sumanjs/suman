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
const parser = require('tap-parser');
import {events} from 'suman-events';
import EE = require('events');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

///////////////////////////////////////////////////////////////////////////

let first = true;

export const getTapParser = function () {

  if(first){
    _suman.log('we are handling TAP.');
  }

  const p = parser();

  p.on('complete', function (data: string) {
    resultBroadcaster.emit(String(events.TAP_COMPLETE), data);
  });

  p.on('assert', function (testpoint: Object) {

    debugger;

    if (first) {
      first = false;
      console.log('\n');
      _suman.log(chalk.yellow.bold('suman we have received at least one test result via TAP.'));
      console.log('\n');
    }


    resultBroadcaster.emit(String(events.TEST_CASE_END), testpoint);

    if (testpoint.skip) {
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED), testpoint);
    }
    else if (testpoint.todo) {
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




