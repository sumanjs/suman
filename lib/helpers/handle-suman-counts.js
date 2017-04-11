'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');
const EE = require('events');

//project
const _suman = global.__suman = (global.__suman || {});
const handleRequestResponseWithRunner = require('./handle-runner-request-response');
const counts = require('./suman-counts');
const oncePostFn = require('./handle-suman-once-post');
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());

///////////////////////////////////////////////////////////////////

const results = [];

suiteResultEmitter.on('suman-completed', function (obj) {

  counts.completedCount++;
  results.push(obj);

  if (counts.completedCount === counts.sumanCount) {

    let fn;

    let resultz;

    if (_suman.usingRunner) {
      resultz = results.map(i => i.tableData);
      fn = handleRequestResponseWithRunner(resultz);
    }
    else {

      debugger;

      // i may not be defined if testsuite (rootsuite) was skipped
      resultz = results.map(i => i ? i.tableData : null).filter(i => i);

      resultz.forEach(function (table) {
        console.log('\n\n');
        let str = table.toString();
        str = '\t' + str;
        console.log(str.replace(/\n/g, '\n\t'));
        console.log('\n');
      });

      fn = oncePostFn;
    }

    const codes = results.map(i => i.exitCode);

    if (process.env.SUMAN_DEBUG === 'yes') {
      console.log(' => All "exit" codes from test suites => ', codes);
    }

    const highestExitCode = Math.max.apply(null, codes);

    fn(function (err) {

      if (err) {
        console.error(err.stack || err);
      }

      process.exit(highestExitCode);

    });

  }
  else if (counts.completedCount > counts.sumanCount) {
    throw new Error('=> Suman internal implementation error => ' +
      'completedCount should never be greater than sumanCount.');
  }

});
