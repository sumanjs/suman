'use strict';

//npm
const parser = require('tap-parser');
const events = require('suman-events');

//project
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

///////////////////////////////////////////////////////////////////////////

module.exports = function getParser () {

  const p = parser();

  p.on('complete', function(data){
    resultBroadcaster.emit(String(events.TAP_COMPLETE), data);
  });

  p.on('assert', function (testpoint) {

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




