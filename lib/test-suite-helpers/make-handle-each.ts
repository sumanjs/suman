'use strict';

//dts
import {IEachHookObj, IHandleError, ITestSuite} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {IGlobalSumanObj, IPseudoError, ISumanEachHookDomain} from "suman-types/dts/global";
import {ITestDataObj} from "suman-types/dts/it";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
import chalk = require('chalk');
const fnArgs = require('function-arguments');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import su = require('suman-utils');
const {constants} = require('../../config/suman-constants');
import {cloneError} from '../helpers/general';
import {makeHookObj} from './t-proto-hook';
import {makeEachHookCallback} from './make-fini-callbacks';
const helpers = require('./handle-promise-generator');
import {freezeExistingProps} from 'freeze-existing-props'

//////////////////////////////////////////////////////////////////////////////////////

export const makeHandleBeforeOrAfterEach = function (suman: ISuman, gracefulExit: Function) {
  
  return function handleBeforeOrAfterEach(self: ITestSuite, test: ITestDataObj,
                                          aBeforeOrAfterEach: IEachHookObj, cb: Function, retryData?: any) {
    
    if (_suman.uncaughtExceptionTriggered) {
      _suman.log.error('runtime error => uncaughtException experienced => halting program.');
      return;
    }
    
    const {sumanOpts} = _suman;
    aBeforeOrAfterEach.alreadyInitiated = true;
    
    if (test.skipped || test.stubbed || test.failed) {
      // if test.failed => another beforeEach hook failed, so test failed
      return process.nextTick(cb);
    }
    
    const onTimeout = function () {
      const err = cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR);
      err.sumanExitCode = constants.EXIT_CODES.HOOK_TIMED_OUT_ERROR;
      fini(err, true);
    };
    
    const timerObj = {
      timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfterEach.timeout)
    };
    
    const assertCount = {
      num: 0
    };
    
    const d = domain.create() as ISumanEachHookDomain;
    d.sumanEachHook = true;
    d.sumanEachHookName = aBeforeOrAfterEach.desc || '(unknown hook name)';
    d.testDescription = test.desc || '(unknown test case name)';
    
    const fini = makeEachHookCallback(d, assertCount, aBeforeOrAfterEach, timerObj, gracefulExit, cb);
    const fnStr = aBeforeOrAfterEach.fn.toString();
    let dError = false, retries: number;
    
    if (suman.config.retriesEnabled === true && Number.isInteger((retries = test.retries))) {
      _suman.log.warning('enabled retries.');
      fini.retryFn = retryData ? retryData.retryFn : handleBeforeOrAfterEach.bind(null, arguments);
    }
    
    const handlePossibleError = function (err: Error | IPseudoError) {
      if (err) {
        if (typeof err !== 'object') err = new Error(util.inspect(err));
        err.sumanFatal = Boolean(sumanOpts.bail);
        handleError(err);
      }
      else {
        fini(null)
      }
    };
    
    const handleError: IHandleError = function (err: IPseudoError) {
      
      if (aBeforeOrAfterEach.dynamicallySkipped === true) {
        err && _suman.log.warning('Hook was dynamically skipped, but error occurred:', err.message || util.inspect(err));
        return fini(null);
      }
      
      if (fini.retryFn) {
        if (!retryData) {
          return fini.retryFn({retryFn: fini.retryFn, retryCount: 1, maxRetries: retries});
        }
        else if (retryData.retryCount < retries) {
          retryData.retryCount++;
          return fini.retryFn(retryData);
        }
        else {
          _suman.log.error('Maximum retries attempted.');
        }
      }
      
      const errMessage = err && (err.stack || err.message|| util.inspect(err));
      err = cloneError(aBeforeOrAfterEach.warningErr, errMessage, false);
      
      // console.log('error => ', err);
      // console.log('aBeforeOrAfterEach.warningErr => ', aBeforeOrAfterEach.warningErr);
      
      // err = err || new Error('unknown/falsy hook error.');
      //
      // if (typeof err === 'string') {
      //   err = new Error(err);
      // }
      
      test.failed = true;
      test.error = err;
      
      const stk = err.stack || err;
      const formatedStk = typeof stk === 'string' ? stk : util.inspect(stk);
      // const formatedStk = String(stck).split('\n').map(item => '\t' + item).join('\n');
      
      if (!dError) {
        dError = true;
        if (aBeforeOrAfterEach.fatal !== true) {
          _suman.log.warning(chalk.black.bold('Error in each hook:'));
          _suman.log.warning(formatedStk);
          _suman.writeTestError(constants.SUMAN_HOOK_FATAL_WARNING_MESSAGE + formatedStk);
          fini(null);
        }
        else {
          //note we want to exit right away
          gracefulExit({
            sumanFatal: true,
            sumanExitCode: constants.EXIT_CODES.FATAL_HOOK_ERROR,
            stack: constants.SUMAN_HOOK_FATAL_MESSAGE + formatedStk
          });
        }
      }
      else {
        // after second call to error, that's about enough
        d.removeAllListeners();
        _suman.writeTestError('Suman error => Error in each hook => \n' + stk);
      }
    };
    
    d.on('error', handleError);
    
    process.nextTick(function () {
      
      _suman.activeDomain = d;
      
      if (sumanOpts.debug_hooks) {
        _suman.log.info(`now running each hook with name '${chalk.yellow.bold(aBeforeOrAfterEach.desc)}', ` +
          `for test case with name '${chalk.magenta(test.desc)}'.`);
      }
      
      d.run(function runHandleEachHook() {
        
        let isAsyncAwait = false;
        const isGeneratorFn = su.isGeneratorFn(aBeforeOrAfterEach.fn);
        
        if (fnStr.indexOf('async') === 0) {
          isAsyncAwait = true;
        }
        
        //TODO: need to implement all assert methods
        
        const timeout = function (val: number) {
          clearTimeout(timerObj.timer);
          assert(val && Number.isInteger(val), 'value passed to timeout() must be an integer.');
          timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 500000 : val);
        };
        
        const handleNonCallbackMode = function (err: IPseudoError) {
          err = err ? ('Also, you have this error => ' + err.stack || err) : '';
          handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
        };
        
        const t = makeHookObj(aBeforeOrAfterEach, assertCount, handleError, handlePossibleError);
        fini.th = t;
        t.timeout = timeout;
        t.test = {};
        t.test.desc = test.desc;
        t.test.testId = test.testId;
        
        if (aBeforeOrAfterEach.type === 'afterEach/teardownTest') {
          // these properties are sent to afterEach hooks, but not beforeEach hooks
          t.test.result = test.error ? 'failed' : 'passed';
          t.test.error = test.error;
        }
        
        t.data = test.data;
        t.desc = aBeforeOrAfterEach.desc;
        t.value = test.value;
        t.state = 'pending';
        t.shared = self.shared;
        t.__inject = self.$inject;
        t.$inject = self.$inject;
        
        t.fatal = function fatal(err: IPseudoError) {
          err = err || new Error('Stand-in error, since user did not provide one.');
          if (typeof err !== 'object') err = new Error(util.inspect(err));
          err.sumanFatal = true;
          handleError(err);
        };
        
        let args;
        
        if (isGeneratorFn) {
          const handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfterEach);
          args = [freezeExistingProps(t)];
          handlePotentialPromise(helpers.handleGenerator(aBeforeOrAfterEach.fn, args));
        }
        else if (aBeforeOrAfterEach.cb) {
          
          t.callbackMode = true;
          
          // TODO: in the future, we may be able to check for presence of callback, if no callback, then fire error
          // if (!su.checkForValInStr(fnStr, /done/g)) {
          //    throw aBeforeOrAfter.NO_DONE;
          // }
          
          const dne = function done(err: IPseudoError) {
            t.callbackMode ? handlePossibleError(err) : handleNonCallbackMode(err);
          };
          
          t.done = dne;
          
          t.ctn = t.pass = function () {
            // t.pass doesn't make sense since this is not a test case, but for user friendliness
            // this is like t.done() except by design no error will ever get passed
            t.callbackMode ? fini(null) : handleNonCallbackMode(undefined);
          };
          
          args = Object.setPrototypeOf(dne, freezeExistingProps(t));
          
          if (aBeforeOrAfterEach.fn.call(null, args)) {
            _suman.writeTestError(cloneError(aBeforeOrAfterEach.warningErr,
              constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
          }
        }
        else {
          
          const handlePotentialPromise = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfterEach);
          args = freezeExistingProps(t);
          handlePotentialPromise(aBeforeOrAfterEach.fn.call(null, args), false);
        }
        
      });
      
    });
    
  }
  
};
