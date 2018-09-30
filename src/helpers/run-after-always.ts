'use strict';

import {IHandleError, IOnceHookObj, ITestSuite} from "suman-types/dts/test-suite";
import {IGlobalSumanObj, IPseudoError, ISumanDomain} from "suman-types/dts/global";
import {IAfterObj} from "suman-types/dts/after";
import {ISuman, Suman} from "../suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');

//npm
import chalk from 'chalk';
import async = require('async');

//project
import * as su from 'suman-utils';

const helpers = require('../test-suite-helpers/handle-promise-generator');
import {cloneError} from './general';
// import {makeHookParam} from '../test-suite-helpers/t-proto-hook';
import {AllHookParam} from '../test-suite-params/all-hook/all-hook-param';
import {freezeExistingProps} from 'freeze-existing-props'
import {constants} from '../config/suman-constants';

const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////////////////////////

export const runAfterAlways = function (suman: ISuman, cb: Function) {
  
  const allDescribeBlocks: Array<ITestSuite> = suman.allDescribeBlocks;
  
  // this flag prevents premature exit so that we can complete all after.always hooks
  _suman.afterAlwaysEngaged = true;
  
  process.on('uncaughtException', function (e: IPseudoError) {
    
    debugger;  // leave debugger statement here
    
    _suman.log.error('There was an uncaught exception, however, we are currently processing after.always blocks, ' +
      'so this exception will be ignored. => \n', chalk.magenta(su.getCleanErrStr(e)));
  });
  
  process.on('unhandledRejection', function (e: IPseudoError) {
    
    debugger; // leave debugger statement here
    
    _suman.log.error('There was an unhandled rejection, however, we are currently processing after.always blocks, ' +
      'so this exception will be ignored. => \n', chalk.magenta(su.getCleanErrStr(e)));
  });
  
  if (_suman.afterAlwaysHasBeenRegistered) {
    _suman.log.error(chalk.cyan('At least one after.always hook has been registered for test with name:'), '\n\t\t',
      chalk.magenta.bold('"' + suman.desc + '"'));
    _suman.log.error(chalk.yellow('We are currently running after.always hooks. Any uncaught errors ' +
      'will be ignored as best as possible.'));
  }
  
  async.eachSeries(allDescribeBlocks, function (block: ITestSuite, cb: Function) {
    
    block.mergeAfters();
    
    const aftersAlways = block.getAfters().filter(function (anAfter: IAfterObj) {
      return anAfter.always;
    });
    
    async.eachSeries(aftersAlways, function (anAfter: IAfterObj, cb: Function) {
      
      const timerObj = {
        timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : anAfter.timeout)
      };
      
      const assertCount = {
        num: 0
      };
      
      const d: ISumanDomain = domain.create();
      d._sumanBeforeOrAfter = true;
      d._sumanBeforeOrAfterDesc = anAfter.desc || '(unknown)';
      
      const fini = function (err: IPseudoError, someBool: boolean) {
        err && console.error(' Error (this error was ignored by Suman) => ', err.stack || err);
        clearTimeout(timerObj.timer);
        process.nextTick(cb, null);
      };
      
      let dError = false;
      const handleError: IHandleError = function (err: IPseudoError) {
        
        const stk = err ? (err.stack || err) : new Error('Suman error placeholder').stack;
        const formatedStk = String(stk).split('\n').map(item => '\t' + item).join('\n');
        
        if (!dError) {
          dError = true;
          _suman.writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
            'is set to false => \n' + formatedStk);
          fini(err, false);
        }
        else {
          // error handler called more than once, after first call, all we do is simply log the error
          _suman.writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
        }
      };
      
      d.on('error', handleError);
      
      const fnStr = anAfter.fn.toString();
      
      function onTimeout() {
        fini(cloneError(anAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
      }
      
      process.nextTick(function () {
        
        d.run(function () {
          
          let warn = false;
          
          if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
            warn = true;
          }
          
          const isGeneratorFn = su.isGeneratorFn(anAfter.fn);
          
          function timeout(val: number) {
            clearTimeout(timerObj.timer);
            timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
          }
          
          function handleNonCallbackMode(err: IPseudoError) {
            err = err ? ('Also, you have this error => ' + err.stack || err) : '';
            handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
          }
          
          const t = new AllHookParam(anAfter, assertCount, handleError, fini, timerObj);
          fini.thot = t;
          t.timeout = timeout;
          
          t.fatal = function fatal(err: IPseudoError) {
            err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
            fini(err, false);
          };
          
          let arg;
          
          if (isGeneratorFn) {
            const handleGenerator = helpers.makeHandleGenerator(fini);
            // arg = [freezeExistingProps(t)];
            arg = t;
            handleGenerator(anAfter.fn, arg, anAfter.ctx);
          }
          else if (anAfter.cb) {
            
            t.callbackMode = true;
            
            const d = function done(err: IPseudoError) {
              if (!t.callbackMode) {
                handleNonCallbackMode(err);
              }
              else {
                fini(err, false);
              }
            };
            
            t.done = function done(err: IPseudoError) {
              if (!t.callbackMode) {
                handleNonCallbackMode(err);
              }
              else {
                fini(err, false);
              }
            };
            
            t.ctn = function ctn(err: IPseudoError) {
              if (!t.callbackMode) {
                handleNonCallbackMode(err);
              }
              else {
                fini(null, false);
              }
              
            };
            
            // arg = Object.setPrototypeOf(d, freezeExistingProps(t));
            arg = Object.setPrototypeOf(d, t);
            
            if (anAfter.fn.call(anAfter.ctx, arg)) {  //check to see if we have a defined return value
              _suman.writeTestError(cloneError(anAfter.warningErr,
                constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
            }
            
          }
          else {
            const handlePotentialPromise = helpers.handleReturnVal(fini, fnStr);
            // arg = freezeExistingProps(t);
            arg = t;
            handlePotentialPromise(anAfter.fn.call(anAfter.ctx, arg), warn);
          }
          
        });
        
      });
      
    }, cb);
    
  }, cb);
  
};
