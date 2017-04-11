'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//project
const _suman = global.__suman = (global.__suman || {});

///////////////////////////////////////

const execArgs = process.execArgv.slice(0);  //copy it

//////////////////////////////////////////////////////////

const inDebugMode = typeof global.v8debug === 'object';

const expressions = [
  '--debug',
  'debug',
  '--inspect',
  '--debug=5858',
  '--debug-brk=5858'
];

// at least one of these conditions is true
const isDebug = expressions.some(x => execArgs.indexOf(x) > -1);

if (process.env.SUMAN_DEBUG === 'yes') {
  console.log('\n => Exec args => ', util.inspect(execArgs), '\n');
}

if (isDebug) {
  console.log('=> we are debugging with the --debug flag');
}

if (inDebugMode) {
  console.log('=> we are debugging with the debug execArg');
}

module.exports = _suman.weAreDebugging = (isDebug || inDebugMode);
