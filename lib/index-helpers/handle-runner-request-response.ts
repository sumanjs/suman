'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');
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
    TEST_FILE_MILLIS: Date.now() - _suman.sumanInitStartDate,
    OVERALL_DESIGNATOR: 'received'
  };

  data.forEach(function (d) {

    // accumulatedData.ROOT_SUITE_NAME += d.ROOT_SUITE_NAME + ',';
    // accumulatedData.ROOT_SUITE_NAME++;
    accumulatedData.SUITE_COUNT += d.SUITE_COUNT;
    accumulatedData.SUITE_SKIPPED_COUNT += d.SUITE_SKIPPED_COUNT;
    accumulatedData.TEST_CASES_TOTAL += d.TEST_CASES_TOTAL;
    accumulatedData.TEST_CASES_FAILED += d.TEST_CASES_FAILED;
    accumulatedData.TEST_CASES_PASSED += d.TEST_CASES_PASSED;
    accumulatedData.TEST_CASES_SKIPPED += d.TEST_CASES_SKIPPED;
    accumulatedData.TEST_CASES_STUBBED += d.TEST_CASES_STUBBED;

  });

  return function (cb: Function) {

    // if(_suman.$forceInheritStdio){
    //   _suman.logError('cannot send parent/grandparent an IPC message.');
    //   return process.nextTick(cb);
    // }

    const client = getClient();
    const TABLE_DATA = constants.runner_message_type.TABLE_DATA;

    client.on(TABLE_DATA, function onTableDataReceived(data: Object) {
      if (data.info = 'table-data-received') {
        process.removeListener('message', onTableDataReceived);
        cb(null);
      }
    });

    client.emit(TABLE_DATA, {
      type: constants.runner_message_type.TABLE_DATA,
      data: accumulatedData,
      childId: process.env.SUMAN_CHILD_ID
    });

    // process.on('message', function onTableDataReceived (data: any) {
    //   if (data.info = 'table-data-received') {
    //     process.removeListener('message', onTableDataReceived);
    //     cb(null);
    //   }
    // });
    //
    // process.send({
    //   type: constants.runner_message_type.TABLE_DATA,
    //   data: accumulatedData
    // });
  };

};
