//npm
const parser = require('tap-parser');
const events = require('suman-events');

//project
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////////////////////

module.exports = function getParser () {

  const p = parser();

  p.on('complete', function(data){
    resultBroadcaster.emit(events.TAP_COMPLETE, data);
  });

  p.on('assert', function (testpoint) {

    resultBroadcaster.emit(events.TEST_CASE_END, testpoint);

    if (testpoint.skip) {
      resultBroadcaster.emit(events.TEST_CASE_SKIPPED, testpoint);
    }
    else if (testpoint.todo) {
      resultBroadcaster.emit(events.TEST_CASE_STUBBED, testpoint);
    }
    else if (testpoint.ok) {
      resultBroadcaster.emit(events.TEST_CASE_PASS, testpoint);
    }
    else {
      resultBroadcaster.emit(events.TEST_CASE_FAIL, testpoint);
    }
  });

  return p;

};




