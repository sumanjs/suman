'use strict';

//dts
import {IHandleError, ITestSuite} from "suman-types/dts/test-suite";
import {IGlobalSumanObj, IPseudoError, ISumanDomain, ISumanTestCaseDomain} from "suman-types/dts/global";
import {ISuman, Suman} from "../suman";
import {ITestDataObj} from "suman-types/dts/it";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');
import EE = require('events');

//npm
import chalk = require('chalk');
const fnArgs = require('function-arguments');
import {events} from 'suman-events';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');
import {makeTestCaseCallback} from './make-fini-callbacks';
const helpers = require('./handle-promise-generator');
import {cloneError} from '../helpers/general';
import {makeTestCase} from './t-proto-test';
import {freezeExistingProps} from 'freeze-existing-props'
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

/////////////////////////////////////////////////////////////////////////////////////

export const makeHandleTest = function (suman: ISuman, gracefulExit: Function) {
  
  return function handleTest(self: ITestSuite, test: ITestDataObj, cb: Function, retryData?: any) {
    
    //records whether a test was actually attempted
    test.alreadyInitiated = true;
    
    if (_suman.uncaughtExceptionTriggered) {
      _suman.log.error(`runtime error => "UncaughtException already occurred" => halting program.\n[${__filename}]`);
      return;
    }
    
    if (test.stubbed) {
      rb.emit(String(events.TEST_CASE_END), test);
      rb.emit(String(events.TEST_CASE_STUBBED), test);
      return process.nextTick(cb);
    }
    
    if (test.skipped) {
      rb.emit(String(events.TEST_CASE_END), test);
      rb.emit(String(events.TEST_CASE_SKIPPED), test);
      return process.nextTick(cb);
    }
    
    const onTimeout = function () {
      test.timedOut = true;
      const err = cloneError(test.warningErr, constants.warnings.TEST_CASE_TIMED_OUT_ERROR);
      err.isFromTest = true;
      err.isTimeout = true;
      handleErr(err);
    };
    
    const timerObj = {
      timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : test.timeout)
    };
    
    const d = domain.create() as ISumanTestCaseDomain;
    d.sumanTestCase = true;
    d.sumanTestName = test.desc;
    
    const assertCount = {
      num: 0
    };
    
    const fnStr = test.fn.toString();
    const fini = makeTestCaseCallback(d, assertCount, test, timerObj, gracefulExit, cb);
    let derror = false, retries: number;
    
    if (suman.config.retriesEnabled === true && Number.isInteger((retries = test.retries))) {
      fini.retryFn = retryData ? retryData.retryFn : handleTest.bind(null, ...arguments);
    }
    
    const handleErr: IHandleError = function (err: IPseudoError) {
      
      /*
       note: we need to call done in same tick instead of in nextTick
       otherwise it can be called by another location
       */
      
      if (test.dynamicallySkipped === true) {
        err && _suman.log.warning('Test case was dynamically skipped, but error occurred:', err.message || util.inspect(err));
        return fini(null);
      }
      
      if (fini.retryFn) {
        if (!retryData) {
          _suman.log.warning('retrying for the first time.');
          return fini.retryFn({retryFn: fini.retryFn, retryCount: 1, maxRetries: retries});
        }
        else if (retryData.retryCount < retries) {
          retryData.retryCount++;
          _suman.log.warning(`retrying for the ${retryData.retryCount} time.`);
          return fini.retryFn(retryData);
        }
        else {
          _suman.log.error('maximum retires attempted.');
        }
      }
      
      err = err || new Error('unknown hook error.');
      
      if (typeof err === 'string') {
        err = new Error(err);
      }
      
      const stk = err.stack || err;
      const stack = typeof stk === 'string' ? stk : util.inspect(stk);
      // const formattedStk = String(stk).split('\n').map(item => '\t' + item).join('\n');
      
      if (!derror) {
        derror = true;
        fini({stack});
      }
      else {
        // after second call to error, that's about enough
        // d.removeAllListeners();
        // d.exit()  should take care of removing listeners
        _suman.writeTestError('Suman error => Error in test => \n' + stack);
      }
    };
    
    if (test.failed) {
      assert(test.error, 'Suman implementation error: error property should be defined at this point in the program.');
      return handleErr(test.error);
    }
    
    const handlePossibleError = function (err: Error) {
      err ? handleErr(err) : fini(null)
    };
    
    d.on('error', handleErr);
    
    process.nextTick(function () {
      
      const {sumanOpts} = _suman;
      
      if (sumanOpts.debug_hooks) {
        _suman.log.info(`now starting to run test with name '${chalk.magenta(test.desc)}'.`);
      }
      
      d.run(function runHandleTest() {
        
        _suman.activeDomain = d;
        let warn = false;
        let isAsyncAwait = false;
        
        if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
          //TODO: this check needs to get updated, async functions should return promises implicitly
          warn = true;
        }
        
        const isGeneratorFn = su.isGeneratorFn(test.fn);
        
        let timeout = function (val: number) {
          clearTimeout(timerObj.timer);
          assert(val && Number.isInteger(val), 'value passed to timeout() must be an integer.');
          timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
        };
        
        const $throw = function (str: any) {
          handleErr(str instanceof Error ? str : new Error(str));
        };
        
        const handleNonCallbackMode = function (err: IPseudoError) {
          err = err ? ('Also, you have this error => ' + err.stack || err) : '';
          handleErr(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
        };
        
        const t = makeTestCase(test, assertCount, handleErr, handlePossibleError);
        fini.thot = t;
        t.throw = $throw;
        t.timeout = timeout;
        t.__shared = self.shared;
        t.__supply = self.supply;
        t.supply = new Proxy(self.__supply, {
          set(target, property, value, receiver) {
            handleErr(new Error('cannot set any properties on t.supply (in test cases).'));
            return false;
          }
        });
        
        ////////////////////////////////////////////////////////////////////////////////////////////
        
        test.dateStarted = Date.now();
        
        let arg;
        
        if (isGeneratorFn) {
          const handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, test);
          arg = freezeExistingProps(t);
          handlePotentialPromise(helpers.handleGenerator(test.fn, arg));
        }
        else if (test.cb === true) {
          
          t.callbackMode = true;
          
          // TODO: in the future, we may be able to check for presence of callback, if no callback, then fire error
          // if (!su.checkForValInStr(fnStr, /done/g)) {
          //    throw aBeforeOrAfter.NO_DONE;
          // }
          
          const dne = function done(err: Error) {
            t.callbackMode ? handlePossibleError(err) : handleNonCallbackMode(err);
          };
          
          t.done = dne;
          
          t.pass = t.ctn = function () {
            t.callbackMode ? fini(null) : handleNonCallbackMode(null);
          };
          
          t.fail = function fail(err: Error) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              handleErr(err || new Error('t.fail() was called on test (note that null/undefined value ' +
                'was passed as first arg to the fail function.)'));
            }
          };
          
          arg = Object.setPrototypeOf(dne, freezeExistingProps(t));
          if (test.fn.call(null, arg)) {  ///run the fn, but if it returns something, then add warning
            _suman.writeTestError(cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
          }
          
        }
        else {
          const handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, test);
          arg = freezeExistingProps(t);
          handlePotentialPromise(test.fn.call(null, arg), warn, d);
        }
        
      });
      
    });
    
  }
};

