'use strict';

import {IPseudoError} from "../../dts/global";
import {ITestDataObj} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');

/////////////////////////////////////////////////////////

const testErrors = _suman.testErrors = _suman.testErrors || [];
const errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];

//////////////////////////////////////////////////////////


const stckMapFn = function (item: string, index: number) {

  const fst = _suman.sumanOpts.full_stack_traces;

  if (index === 0) {
    return '\t' + item;
  }

  if(fst){
    return su.padWithXSpaces(4) + item;
  }

  if (String(item).match(/\//) && !String(item).match(/\/node_modules\//) &&
    !String(item).match(/internal\/process\/next_tick.js/)) {
    return su.padWithXSpaces(4) + item;
  }

};


/////////////////////////////////////////////////////////////////////////////////////

export = function makeHandleTestError (suman: ISuman) {

  const fileName = suman.fileName;

  return function handleTestError (err: IPseudoError, test: ITestDataObj) {

    if (_suman.sumanUncaughtExceptionTriggered) {
      _suman.logError(`runtime error => "UncaughtException:Triggered" => halting program.\n[${__filename}]`);
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

      if (su.isSumanDebug()) {
        _suman._writeTestError('\n\nTest error: ' + test.desc + '\n\t' + 'stack: ' + test.error.stack + '\n\n');
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
