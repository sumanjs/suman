'use strict';


//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');


//core
const util = require('util');
const EE = require('events');

//project
const handleRequestResponseWithRunner = require('./handle-runner-request-response');
const counts = require('./suman-counts');
const oncePostFn = require('./handle-suman-once-post');
const suiteResultEmitter = global.suiteResultEmitter = (global.suiteResultEmitter || new EE());

///////////////////////////////////////////////////////////////////

const results = [];

suiteResultEmitter.on('suman-completed', function (obj) {

  counts.completedCount++;
  results.push(obj);

  if (counts.completedCount === counts.sumanCount) {

    let fn;

    let resultz;

    if (global.usingRunner) {
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

    debugger;
    
    const highestExitCode = Math.max.apply(null, codes);

    fn(function (err) {

      debugger;

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
