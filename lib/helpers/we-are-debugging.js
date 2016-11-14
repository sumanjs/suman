'use strict';

const util = require('util');

///////////////////////////////////////

const argz = process.argv.slice(2);
const execArgs = process.execArgv;

//////////////////////////////////////////////////////////

const isDebug =
  (execArgs.indexOf('--debug') > -1) ||
  (execArgs.indexOf('debug') > -1) ||
  (execArgs.indexOf('--inspect') > -1) ||
  (execArgs.indexOf('--debug=5858') > -1) ||
  (execArgs.indexOf('--debug-brk=5858') > -1);

if(process.env.SUMAN_DEBUG === 'yes'){
  console.log(util.inspect('Exec args => ' + execArgs));
}


if (isDebug) {
    console.log('=> we are debugging with the --debug flag');
}

const inDebugMode = typeof global.v8debug === 'object';

if (inDebugMode) {
    console.log('=> we are debugging with the debug execArg');
}


module.exports = global.weAreDebugging = (isDebug || inDebugMode || global.weAreDebuggingViaSuman);