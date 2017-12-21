'use strict';

//dts
import {IHandleError, IOnceHookObj, ITestSuite} from "suman-types/dts/test-suite";
import {IGlobalSumanObj, IPseudoError, ISumanAllHookDomain, ISumanDomain} from "suman-types/dts/global";
import {ISuman, Suman} from "../suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
import su from 'suman-utils';
import chalk = require('chalk');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {makeAllHookCallback} from './make-fini-callbacks';
const helpers = require('./handle-promise-generator');
const {constants} = require('../../config/suman-constants');
import {cloneError} from '../helpers/general';
// import {makeHookParam} from './t-proto-hook';
import {AllHookParam} from "../test-suite-params/all-hook/all-hook-param";
import {freezeExistingProps} from 'freeze-existing-props';


/////////////////////////////////////////////////////////////////////////////////////

export const makeHandleBeforesAndAfters = function (suman: ISuman, gracefulExit: Function) {
  
  return function handleBeforesAndAfters(self: ITestSuite, aBeforeOrAfter: IOnceHookObj, cb: Function, retryData?: any) {
    
    if (_suman.uncaughtExceptionTriggered) {
      _suman.log.error(
        `runtime error => "UncaughtException already occurred" => halting program in file:\n[${__filename}]`
      );
      return;
    }
    
    // records whether a hook was actually attempted
    // IMPORTANT: this should appear after the _suman.uncaughtExceptionTriggered check
    // because an after.always hook needs to run even in the presence of an uncaught exception
    aBeforeOrAfter.alreadyInitiated = true;
    
    const onTimeout = function () {
      fini(cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
    };
    
    const timerObj = {
      timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfter.timeout)
    };
    
    const assertCount = {
      num: 0
    };
    
    const d = domain.create() as ISumanAllHookDomain;
    d.sumanAllHook = true;
    d.sumanAllHookName = aBeforeOrAfter.desc || '(unknown all-hook name)';
    
    const fini = makeAllHookCallback(d, assertCount, aBeforeOrAfter, timerObj, gracefulExit, cb);
    const fnStr = aBeforeOrAfter.fn.toString();
    
    if (suman.config.retriesEnabled === true && Number.isInteger(aBeforeOrAfter.retries)) {
      fini.retryFn = retryData ? retryData.retryFn : handleBeforesAndAfters.bind(null, ...Array.from(arguments));
    }
    
    let dError = false;
    
    const handleError: IHandleError = function (err: IPseudoError) {
      
      if (aBeforeOrAfter.dynamicallySkipped === true) {
        return fini(null);
      }
      
      if (fini.retryFn) {
        if (!retryData) {
          return fini.retryFn({retryFn: fini.retryFn, retryCount: 1, maxRetries: aBeforeOrAfter.retries});
        }
        else if (retryData.retryCount < aBeforeOrAfter.retries) {
          retryData.retryCount++;
          return fini.retryFn(retryData);
        }
        else {
          _suman.log.error('maximum retries attempted.');
        }
      }
  
      const errMessage = err && (err.stack || err.message|| util.inspect(err));
      err = cloneError(aBeforeOrAfter.warningErr, errMessage, false);
      
      
      const stk = err.stack || err;
      const formatedStk = typeof stk === 'string' ? stk : util.inspect(stk);
      // const formatedStk = String(stck).split('\n').map(item => '\t' + item).join('\n');
      
      if (!dError) {
        dError = true;
        clearTimeout(timerObj.timer);
        if (aBeforeOrAfter.fatal === false) {
          _suman.writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
            'is set to false => \n' + formatedStk);
          fini(null);
        }
        else {
          //errors are always fatal in all hooks, unless fatal is explicitly set to false
          gracefulExit({
            sumanFatal: true,
            sumanExitCode: constants.EXIT_CODES.FATAL_HOOK_ERROR,
            stack: 'Fatal error in hook => (to continue even in the event of an error ' +
            'in a hook use option {fatal:false}) => ' + '\n' + formatedStk
          });
        }
      }
      else {
        // error handler called more than once, after first call, all we do is simply log the error
        _suman.writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
      }
    };
    
    const handlePossibleError = function (err: Error | IPseudoError) {
      err ? handleError(err) : fini(null)
    };
    
    d.on('error', handleError);
    
    process.nextTick(function () {
      
      const {sumanOpts} = _suman;
      
      if (sumanOpts.debug_hooks) {
        _suman.log.info(`now running all hook with name '${chalk.yellow(aBeforeOrAfter.desc)}'.`);
      }
      
      // need to d.run instead process.next so that errors thrown in same-tick get trapped by "Node.js domains in browser"
      // process.nextTick is necessary in the first place, so that async module does not experience Zalgo
      
      d.run(function runAllHook() {
        
        _suman.activeDomain = d;
        let warn = false;
        
        if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
          warn = true;
        }
        
        const isGeneratorFn = su.isGeneratorFn(aBeforeOrAfter.fn);
        
        const timeout = function (val: number) {
          clearTimeout(timerObj.timer);
          assert(val && Number.isInteger(val), 'value passed to timeout() must be an integer.');
          timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
        };
        
        const handleNonCallbackMode = function (err: IPseudoError) {
          err = err ? ('Also, you have this error => ' + err.stack || err) : '';
          handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
        };
        
        const t = new AllHookParam(aBeforeOrAfter, assertCount, handleError, handlePossibleError);
        t.__shared = self.shared;
        t.supply = self.supply;
        t.desc = aBeforeOrAfter.desc;
        fini.thot = t;
        t.timeout = timeout;
        
        let arg;
        
        if (isGeneratorFn) {
          const handle = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfter);
          // arg = [freezeExistingProps(t)];
          arg = t;
          handle(helpers.handleGenerator(aBeforeOrAfter.fn, arg));
        }
        else if (aBeforeOrAfter.cb) {
          
          t.callbackMode = true;
          
          // TODO: in the future, we may be able to check for presence of callback, if no callback, then fire error
          // if (!su.checkForValInStr(fnStr, /done/g)) {
          //    throw aBeforeOrAfter.NO_DONE;
          // }
          
          const dne = function done(err: IPseudoError) {
            t.callbackMode ? handlePossibleError(err) : handleNonCallbackMode(err);
          };
          
          t.done = dne;
          
          t.ctn = t.pass = function (err: IPseudoError) {
            t.callbackMode ? fini(null) : handleNonCallbackMode(err);
          };
          
          // arg = Object.setPrototypeOf(dne, freezeExistingProps(t));
          arg = Object.setPrototypeOf(dne, t);
          
          if (aBeforeOrAfter.fn.call(null, arg)) {  //check to see if we have a defined return value
            _suman.writeTestError(cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
          }
          
        }
        else {
          const handle = helpers.handleReturnVal(handlePossibleError, fnStr, aBeforeOrAfter);
          // arg = freezeExistingProps(t);
          arg = t;
          handle(aBeforeOrAfter.fn.call(null, arg), warn);
        }
        
      });
      
    });
  }
};
