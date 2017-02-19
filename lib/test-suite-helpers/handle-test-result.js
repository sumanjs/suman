//core
const util = require('util');

//project
const sumanUtils = require('suman-utils/utils');

/////////////////////////////////////////////////////////

const testErrors = global.testErrors = global.testErrors || [];
const errors = global.sumanRuntimeErrors = global.sumanRuntimeErrors || [];

//////////////////////////////////////////////////////////


const stckMapFn = function (item, index) {

  const fst = global.sumanOpts.full_stack_traces;

  if (index === 0) {
    return '\t' + item;
  }

  if(fst){
    return sumanUtils.padWithXSpaces(4) + item;
  }

  if (String(item).match(/\//) && !String(item).match(/\/node_modules\//) && !String(item).match(/internal\/process\/next_tick.js/)) {
    return sumanUtils.padWithXSpaces(4) + item;
  }
  // if (sumanFatal) { //TODO: why is sumanFatal here for tests
  //   return sumanUtils.padWithXSpaces(4) + item;
  // }


};


//////////////////////////////////////////////////////////

module.exports = function makeHandleTestError (suman) {

  const fileName = suman.fileName;

  return function handleTestError (err, test) {

    if (global.sumanUncaughtExceptionTriggered) {
      console.error(' => Suman runtime error => "UncaughtException:Triggered" => halting program.');
      return;
    }

    test.error = null;

    if (err) {

      const sumanFatal = err.sumanFatal;

      if (err instanceof Error) {

        test.error = err;
        test.errorDisplay = String(err.stack).split('\n')
        .filter(item => item)
        .map(stckMapFn)
        .filter(item => item)
        .join('\n')
        .concat('\n');

      }
      else if (typeof err.stack === 'string') {

        test.error = err;
        test.errorDisplay = String(err.stack).split('\n')
        .filter(item => item)
        .map(stckMapFn)
        .filter(item => item)
        .join('\n')
        .concat('\n');
      }
      else {
        throw new Error('Suman internal implementation error => invalid error format.');
      }

      if (process.env.SUMAN_DEBUG === 'yes') {
        global._writeTestError('\n\nTest error: ' + test.desc + '\n\t' + 'stack: ' + test.error.stack + '\n\n');
      }

      testErrors.push(test.error);
    }

    if (test.error) {
      test.error.isFromTest = true;
    }

    suman.logResult(test);

    return test.error;
  }
};
