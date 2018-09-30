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
import chalk from 'chalk';
const fnArgs = require('function-arguments');
import {events} from 'suman-events';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from '../config/suman-constants';
import {makeTestCaseCallback} from './make-fini-callbacks';
const helpers = require('./handle-promise-generator');
import {cloneError} from '../helpers/general';
import {TestCaseParam} from "../test-suite-params/test-case/test-case-param";
import {freezeExistingProps} from 'freeze-existing-props'
const rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();

/////////////////////////////////////////////////////////////////////////////////////

export const makeHandleTest = function (suman: ISuman, gracefulExit: Function) {

  // don't use arrow function here, b/c we may need to access arguments for retry action
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
    
    const timerObj = {
      timer: null as any
    };
    
    const assertCount = {
      num: 0
    };
    
    const d = domain.create() as ISumanTestCaseDomain;
    d.sumanTestCase = true;
    d.sumanTestName = test.desc;
    const fnStr = test.fn.toString();
    const fini = makeTestCaseCallback(d, assertCount, test, timerObj, gracefulExit, cb);
    let derror = false, retries: number;
    
    const handleErr: IHandleError = function (err: IPseudoError) {
      
      /*
       note: we need to call done in same tick instead of in nextTick
       otherwise it can be called again by user's code
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
      
      const errMessage = err && (err.stack || err.message || util.inspect(err));
      err = cloneError(test.warningErr, errMessage, false);
      
      const stk = err.stack || err;
      const stack = typeof stk === 'string' ? stk : util.inspect(stk);
      // const formattedStk = String(stk).split('\n').map(item => '\t' + item).join('\n');
      
      if (!derror) {
        derror = true;
        fini({stack});
      }
      else {
        // after second call to error, that's about enough
        d.removeAllListeners();
        _suman.writeTestError('Suman error => Error in test => \n' + stack);
      }
    };
    
    if (suman.config.retriesEnabled === true && Number.isInteger((retries = test.retries))) {
      fini.retryFn = retryData ? retryData.retryFn : handleTest.bind(null, ...arguments);
    }
    else if (test.retries && !Number.isInteger(test.retries)) {
      return handleErr(new Error('retries property is not an integer => ' + util.inspect(test.retries)));
    }
    
    if (test.failed) {
      assert(test.error, 'Suman implementation error: error property should be defined at this point in the program.');
      return handleErr(test.error || new Error('Suman implementation error - <test.error> was falsy.'));
    }
    
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
        
        if (fnStr.indexOf('async') === 0) {
          isAsyncAwait = true;
          warn = true;
        }
        
        const t = new TestCaseParam(test, assertCount, handleErr, fini, timerObj);
        fini.thot = t;
        t.__shared = self.shared;
        t.__supply = self.supply;
        t.supply = new Proxy(self.__supply, {
          set: t.__inheritedSupply.bind(t)
        });
        
        ////////////////////////////////////////////////////////////////////////////////////////////
        
        test.dateStarted = Date.now();
        
        if (su.isGeneratorFn(test.fn)) {
          const handlePotentialPromise = helpers.handleReturnVal(t.handlePossibleError.bind(t), fnStr, test);
          handlePotentialPromise(helpers.handleGenerator(test.fn, t));
        }
        else if (test.cb === true) {
          
          t.callbackMode = true;
          
          // TODO: in the future, we may be able to check for presence of callback, if no callback, then fire error
          // if (!su.checkForValInStr(fnStr, /done/g)) {
          //    throw aBeforeOrAfter.NO_DONE;
          // }
          
          const dne = function done(err?: any) {
            t.handlePossibleError(err);
          };
          
          t.done = dne;
          
          // these functions cannot be put on prototype because we may not have a reference to "this"
          t.pass = t.ctn = function () {
            fini(null);
          };
          
          t.fail = function (err: Error) {
            handleErr(err || new Error('t.fail() was called on test (note that null/undefined value ' +
              'was passed as first arg to the fail function.)'));
          };
          
          let arg = Object.setPrototypeOf(dne, t);
          if (test.fn.call(null, arg)) {  ///run the fn, but if it returns something, then add warning
            _suman.writeTestError(cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
          }
          
        }
        else {
          const handlePotentialPromise = helpers.handleReturnVal(t.handlePossibleError.bind(t), fnStr, test);
          handlePotentialPromise(test.fn.call(null, t), warn, d);
        }
        
      });
      
    });
    
  }
};

