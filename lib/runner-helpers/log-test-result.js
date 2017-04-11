'use strict';

//npm
const events = require('suman-events');
const sumanUtils = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////

module.exports  = function logTestResult (data, n) {

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
