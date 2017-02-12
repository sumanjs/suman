'use strict';

//npm
const events = require('suman-events');

//project
function title (test) {
  return String(test.title).replace(/#/g, '');
}

module.exports = s => {

  var n = 1;
  var passes = 0;
  var failures = 0;

  s.on(events.RUNNER_STARTED, function () {
    console.log(' => Suman runner has started.');
  });

  s.on(events.RUNNER_ENDED, function () {
    console.log('# tests ' + (passes + failures));
    console.log('# pass ' + passes);
    console.log('# fail ' + failures);
  });

  s.on(events.SUITE_SKIPPED, function () {
    console.log('# tests ' + (passes + failures));
    console.log('# pass ' + passes);
    console.log('# fail ' + failures);
  });

  s.on(events.SUITE_END, function () {
    console.log('# tests ' + (passes + failures));
    console.log('# pass ' + passes);
    console.log('# fail ' + failures);
  });

  s.on(events.TEST_CASE_END, function onTestEnd () {
    ++n;
  });

  s.on(events.TEST_CASE_FAIL, function (test) {
    console.log('not ok %d %s', n, title(test));
  });

  s.on(events.TEST_CASE_PASS, function (test) {
    console.log('ok %d %s', n, title(test));
  });

  s.on(events.TEST_CASE_SKIPPED, function (test) {
    console.log('ok %d %s # SKIP -', n, title(test));
  });

  s.on(events.TEST_CASE_STUBBED, function (test) {
    console.log('ok %d %s # STUBBED -', n, title(test));
  });

};
