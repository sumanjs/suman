'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ITAPJSONTestCase} from "suman-types/dts/reporters";
import {Stream, Transform} from "stream";

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

  p.on('testpoint', function (d: ITAPJSONTestCase) {

    if (first) {
      first = false;
      console.log('\n');
      _suman.log.info(chalk.yellow.bold('suman runner has received first test result via TAP.'));
      console.log('\n');
    }

    const testpoint = d.testCase;

    if (!testpoint) {
      _suman.log.error('implementation warning: testpoint data does not exist for tap-json object => ',
        util.inspect(d));
      return;
    }

    resultBroadcaster.emit(String(events.TEST_CASE_END_TAP_JSON), d);

    if (testpoint.skip) {
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED_TAP_JSON), d);
    }
    else if (testpoint.todo) {
      resultBroadcaster.emit(String(events.TEST_CASE_STUBBED_TAP_JSON), d);
    }
    else if (testpoint.ok) {
      resultBroadcaster.emit(String(events.TEST_CASE_PASS_TAP_JSON), d);
    }
    else {
      resultBroadcaster.emit(String(events.TEST_CASE_FAIL_TAP_JSON), d);
    }
  });

  return p;

};




