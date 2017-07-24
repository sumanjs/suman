'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});

///////////////////////////////////////////////////////////////////////////////

module.exports = function _handleSetupComplete(test, type) {
  if (test.isSetupComplete) {
    console.log(' => Illegal registry of type => "' + type + '".');
    console.error('\n', chalk.red.bold(' => Suman usage error => fatal => Asynchronous registry of test suite methods. Fatal AF.'), '\n\n');
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

    _suman.sumanRuntimeErrors.push(e);
    e.sumanFatal = true;

    e.stack = String(e.stack).split('\n').filter(function (line) {
      return !/\/node_modules\//.test(line) && !/\/next_tick.js/.test(line);
    })
    // .map(function (line) {
    //   return chalk.red.bold(line);
    // })
    .join('\n');

    if (test) {
      console.error(' => Regarding the following test suite =>');
      console.error(util.inspect(test.title || test.desc));
    }
    throw e;
  }
};
