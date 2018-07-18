'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IItOpts, ITestDataObj} from "suman-types/dts/it";
import {IBeforeEachObj} from "suman-types/dts/before-each";
import {IAFterEachObj} from "suman-types/dts/after-each";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import * as async from 'async';
import {events} from 'suman-events';
import * as _ from 'lodash';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {makeHandleTest} from './make-handle-test';
import {makeHandleBeforeOrAfterEach} from './make-handle-each';
import {implementationError} from '../helpers/general';
import {TestBlock} from "./test-suite";
const rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();
const testErrors = _suman.testErrors = _suman.testErrors || [];
const errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];

////////////////////////////////////////////////////////////////////////////////

const getAllBeforesEaches = function (zuite: TestBlock) {
  
  const beforeEaches: Array<Array<IBeforeEachObj>> = [];
  beforeEaches.unshift(zuite.getBeforeEaches());
  
  if (!zuite.alreadyHandledAfterAllParentHooks) {
    zuite.alreadyHandledAfterAllParentHooks = true;
    beforeEaches.unshift(zuite.getAfterAllParentHooks());
  }
  
  const getParentBefores = function (parent: TestBlock) {
    beforeEaches.unshift(parent.getBeforeEaches());
    if (parent.parent) {
      getParentBefores(parent.parent);
    }
  };
  
  if (zuite.parent) {
    getParentBefores(zuite.parent);
  }

  //flatten
  return beforeEaches.reduce( (a, b) => a.concat(b), [])
};

//////////////////////////////////////////////////////////////////////////////////////////

const getAllAfterEaches = function (zuite: TestBlock) {
  
  const afterEaches: Array<Array<IAFterEachObj>> = [];
  afterEaches.push(zuite.getAfterEaches());
  
  const getParentAfters = function (parent: TestBlock) {
    afterEaches.push(parent.getAfterEaches());
    if (parent.parent) {
      getParentAfters(parent.parent);
    }
  };
  
  if (zuite.parent) {
    getParentAfters(zuite.parent);
  }

  //flatten
  return afterEaches.reduce( (a, b) => a.concat(b), [])
};

//////////////////////////////////////////////////////////

const stckMapFn = function (item: string, index: number) {
  
  const fst = _suman.sumanOpts && _suman.sumanOpts.full_stack_traces;
  
  if (!item) {
    return '';
  }
  
  if (index === 0) {
    return '\t' + item;
  }
  
  if (fst) {
    return su.padWithXSpaces(4) + item;
  }
  
  if ((String(item).match(/\//) || String(item).match('______________')) && !String(item).match(/\/node_modules\//) &&
    !String(item).match(/internal\/process\/next_tick.js/)) {
    return su.padWithXSpaces(4) + item;
  }
  
};

const handleTestError = function (err: any, test: ITestDataObj) {
  
  if (_suman.uncaughtExceptionTriggered) {
    _suman.log.error(`runtime error => "UncaughtException:Triggered" => halting program.\n[${__filename}]`);
    return;
  }
  
  if (err) {
    
    if (err instanceof Error) {
      
      test.error = err;
      test.errorDisplay = String(err.stack).split('\n')
      .concat(`\t${su.repeatCharXTimes('_', 70)}`)
      .map(stckMapFn)
      .filter(item => item)
      .join('\n')
      .concat('\n');
      
    }
    else if (typeof err.stack === 'string') {
      
      test.error = err;
      test.errorDisplay = String(err.stack).split('\n')
      .concat(`\t${su.repeatCharXTimes('_', 70)}`)
      .map(stckMapFn)
      .filter(item => item)
      .join('\n')
      .concat('\n');
    }
    else {
      throw new Error('Suman internal implementation error => invalid error format, please report this.');
    }
    
    if (su.isSumanDebug()) {
      _suman.writeTestError('\n\nTest error: ' + test.desc + '\n\t' + 'stack: ' + test.error.stack + '\n\n');
    }
    
    testErrors.push(test.error);
  }
  
  if (test.error) {
    test.error.isFromTest = true;
  }
  
  return test.error;
};

////////////////////////////////////////////////////////////////////////////////

export const makeTheTrap = function (suman: ISuman, gracefulExit: Function) {
  
  const handleTest = makeHandleTest(suman, gracefulExit);
  const handleBeforeOrAfterEach = makeHandleBeforeOrAfterEach(suman, gracefulExit);
  
  return function runTheTrap(self: TestBlock, test: ITestDataObj, opts: Partial<IItOpts>, cb: Function) {
    
    if (_suman.uncaughtExceptionTriggered) {
      _suman.log.error(`runtime error => "uncaughtException" event => halting program.\n[${__filename}]`);
      return;
    }
    
    const sumanOpts = suman.opts,
      sumanConfig = suman.config;
    let delaySum = 0; //TODO: is this correct?
    
    if (test.stubbed) {
      rb.emit(String(events.TEST_CASE_END), test);
      rb.emit(String(events.TEST_CASE_STUBBED), test);
      return process.nextTick(cb, null);
    }
    
    if (test.skipped) {
      rb.emit(String(events.TEST_CASE_END), test);
      rb.emit(String(events.TEST_CASE_SKIPPED), test);
      return process.nextTick(cb, null);
    }
    
    const parallel = sumanOpts.parallel || (opts.parallel && !_suman.sumanOpts.series);
    
    async.eachSeries(getAllBeforesEaches(self), function (aBeforeEach: IBeforeEachObj, cb: Function) {
        handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
      },
      function doneWithBeforeEaches(err: any) {
        
        implementationError(err);
        
        if (parallel) {
          delaySum += (test.delay || 0);
        } else {
          delaySum = 0;
        }
        
        async.series([
            function (cb: Function) {
              
              const handleTestContainer = function () {
                handleTest(self, test, function (err: null, potentialTestError: Error) {
                  implementationError(err);
                  handleTestError(potentialTestError, test);
                  suman.logResult(test);
                  cb(null);
                });
              };
              
              if (delaySum) { // if non-zero / non-falsy value
                setTimeout(handleTestContainer, delaySum);
              }
              else {
                handleTestContainer();
              }
            },
            
            function (cb: Function) {
              
              async.eachSeries(getAllAfterEaches(self), function (aAfterEach: IAFterEachObj, cb: Function) {
                  handleBeforeOrAfterEach(self, test, aAfterEach, cb);
                },
                function done(err: any) {
                  implementationError(err);
                  process.nextTick(cb);
                });
              
            }
          ],
          function doneWithTests(err: any, results: Array<any>) {
            err && _suman.log.error('Suman implementation error => the following error should not be present => ', err);
            cb(null, results);
          });
        
      });
  }
  
};
