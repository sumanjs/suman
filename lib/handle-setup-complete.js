'use strict';


//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const _suman = global.__suman = (global.__suman || {});
const colors = require('colors/safe');

///////////////////////////////////////////////////////////////////////////////

module.exports = function handleSetupComplete(test) {
  if (test.isSetupComplete) {
    console.error('\n', colors.red.bold(' => Suman usage error => fatal => Asynchronous registry of test suite methods. Fatal AF.'), '\n\n');
    const e = new Error('Suman usage error => Fatal error => You have attempted to register calls to a\n' +
      'test suite block that has already finished registering hooks, test cases and child blocks.\n' +
      'To be more exact, one of two things happened: Either (1) ' +
      'You referenced a parent suite block inside a\nchild suite block by accident, or more likely (2) you called registry' +
      ' functions asynchronously.\n' +
      '\nYou cannot call the following functions asynchronously - describe(), it(), ' +
      'before(), beforeEach(), after(), afterEach()\n- do not ' +
      'put these calls inside a setTimeout, setImmediate, process.nextTick or any other asynchronous calls.\n' +
      ' *** !! This includes nesting these calls inside each other. !! ***\n\t' +
      '\nThis is a fatal error because behavior will be completely indeterminate upon asynchronous ' +
      'registry of these calls.');
    global.sumanRuntimeErrors.push(e);
    e.sumanFatal = true;
    throw e;
  }
};
