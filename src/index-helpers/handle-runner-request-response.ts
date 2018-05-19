'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from '../config/suman-constants';
import {getClient} from './socketio-child-client'

///////////////////////////////////////////////////////////////////

export const handleRequestResponseWithRunner = function (data: Array<any>) {

  const accumulatedData = {
    ROOT_SUITE_NAME: '',
    SUITE_COUNT: 0,
    SUITE_SKIPPED_COUNT: 0,
    TEST_CASES_TOTAL: 0,
    TEST_CASES_FAILED: 0,
    TEST_CASES_PASSED: 0,
    TEST_CASES_SKIPPED: 0,
    TEST_CASES_STUBBED: 0,
    TEST_FILE_MILLIS: Date.now() - _suman.sumanInitStartDate
  };

  data.forEach(function (d) {
    accumulatedData.SUITE_COUNT += d.SUITE_COUNT;
    accumulatedData.SUITE_SKIPPED_COUNT += d.SUITE_SKIPPED_COUNT;
    accumulatedData.TEST_CASES_TOTAL += d.TEST_CASES_TOTAL;
    accumulatedData.TEST_CASES_FAILED += d.TEST_CASES_FAILED;
    accumulatedData.TEST_CASES_PASSED += d.TEST_CASES_PASSED;
    accumulatedData.TEST_CASES_SKIPPED += d.TEST_CASES_SKIPPED;
    accumulatedData.TEST_CASES_STUBBED += d.TEST_CASES_STUBBED;
  });

  return function (cb: Function) {

    try{
      if(window.__karma__){
        return process.nextTick(cb);
      }
    }
    catch(err){}

    const client = getClient();
    const TABLE_DATA = constants.runner_message_type.TABLE_DATA;

    let timedout = false;
    const to = setTimeout(function () {
      timedout = true;
      _suman.log.error('Action to receive table data response from runner timed out.');
      cb(null);
    }, 1000);

    client.on(TABLE_DATA, function onTableDataReceived(data: Object) {
      if (data.info = 'table-data-received' && timedout === false) {
        clearTimeout(to);
        process.nextTick(cb);
      }
    });

    let childId;
    try {
      if (window) {
        childId = window.__suman.SUMAN_CHILD_ID;
      }
    }
    catch (err) {}

    client.emit(TABLE_DATA, {
      type: constants.runner_message_type.TABLE_DATA,
      data: accumulatedData,
      childId: childId || process.env.SUMAN_CHILD_ID
    });

  };

};
