
//npm
const events = require('suman-events');
const sumanUtils = require('suman-utils/utils');

//project
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////


module.exports  = function logTestResult (data, n) {

  const test = data.test;

  resultBroadcaster.emit(events.TEST_CASE_END, test);

  if (test.errorDisplay) {
    resultBroadcaster.emit(events.TEST_CASE_FAIL, test);
  }
  else {

    if (test.skipped) {
      resultBroadcaster.emit(events.TEST_CASE_SKIPPED, test);
    }
    else if (test.stubbed) {
      resultBroadcaster.emit(events.TEST_CASE_STUBBED, test);
    }
    else {
      resultBroadcaster.emit(events.TEST_CASE_PASS, test);
    }
  }
};
