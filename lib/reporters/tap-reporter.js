'use strict';

//core
const util = require('util');

//npm
const events = require('suman-events');

//project
function title (test) {
  return String(test.title || test.desc || test.description).replace(/#/g, '');
}

//////////////////////////////////////////////////////////

module.exports = s => {

  var n = 0;
  var passes = 0;
  var failures = 0;
  var skipped = 0;
  var stubbed = 0;

  s.on(events.RUNNER_STARTED, function () {
    console.log(' => Suman runner has started.\n');
  });

  s.on(events.RUNNER_ENDED, function () {
    console.log('# tests ' + (passes + failures));
    console.log('# pass ' + passes);
    console.log('# fail ' + failures);
    console.log('# stubbed ' + failures);
    console.log('# skipped ' + failures);
  });

  s.on(events.SUITE_SKIPPED, function () {

  });

  s.on(events.SUITE_END, function () {

  });

  s.on(events.TEST_CASE_END, function (test) {
    ++n;
  });

  s.on(events.TEST_CASE_FAIL, function (test) {
    failures++;
    console.log('not ok %d %s', n, title(test));
  });

  s.on(events.TEST_CASE_PASS, function (test) {
    passes++;
    console.log('ok %d %s', n, title(test));
  });

  s.on(events.TEST_CASE_SKIPPED, function (test) {
    skipped++;
    console.log('ok %d %s # SKIP -', n, title(test));
  });

  s.on(events.TEST_CASE_STUBBED, function (test) {
    stubbed++;
    console.log('ok %d %s # STUBBED -', n, title(test));
  });

};
