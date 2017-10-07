'use strict';

//dts
import {IHandleError, IOnceHookObj, ITestSuite} from "dts/test-suite";
import {ISuman} from "suman-types/dts/suman";
import {IGlobalSumanObj, IPseudoError, ISumanAllHookDomain, ISumanDomain} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import su from 'suman-utils';
import chalk = require('chalk');
import {makeCallback} from './handle-callback-helper';
const helpers = require('./handle-promise-generator');
const {constants} = require('../../config/suman-constants');
import {cloneError} from '../misc/clone-error';
import {makeHookObj} from './t-proto-hook';
import {freezeExistingProps} from 'freeze-existing-props';

/////////////////////////////////////////////////////////////////////////////////////

export const makeHandleBeforesAndAfters = function (suman: ISuman, gracefulExit: Function) {

  return function handleBeforesAndAfters(self: ITestSuite, aBeforeOrAfter: IOnceHookObj, cb: Function) {

    if (_suman.sumanUncaughtExceptionTriggered) {
      _suman.logError(`runtime error => "UncaughtException:Triggered" => halting program in file:\n[${__filename}]`);
      return;
    }

    // records whether a hook was actually attempted
    // IMPORTANT: this should appear after the _suman.sumanUncaughtExceptionTriggered check
    // because an after.always hook needs to run even in the presence of an uncaught exception
    aBeforeOrAfter.alreadyInitiated = true;

    const timerObj = {
      timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfter.timeout)
    };

    const assertCount = {
      num: 0
    };

    const d = domain.create() as ISumanAllHookDomain;
    _suman.activeDomain = d;
    d.sumanAllHook = true;
    d.sumanAllHookName = aBeforeOrAfter.desc || '(unknown all-hook name)';

    const fini = makeCallback(d, assertCount, null, aBeforeOrAfter, timerObj, gracefulExit, cb);
    const fnStr = aBeforeOrAfter.fn.toString();

    function onTimeout() {
      fini(cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
    }

    //TODO: need to add more info to logging statement below and also handle if fatal:false
    let dError = false;

    const handleError: IHandleError = function (err: IPseudoError) {

      err = err || new Error('unknown hook error.');

      if (typeof err === 'string') {
        err = new Error(err);
      }

      const stk = err.stack || err;
      const stck = typeof stk === 'string' ? stk : util.inspect(stk);
      const formatedStk = String(stck).split('\n').map(item => '\t' + item).join('\n');

      if (!dError) {
        dError = true;
        clearTimeout(timerObj.timer);
        if (aBeforeOrAfter.fatal === false) {
          _suman.writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
            'is set to false => \n' + formatedStk);
          fini(null);
        }
        else {
          //always fatal error in beforeEach/afterEach, unless fatal is explicitly set to false
          gracefulExit({
            sumanFatal: true,
            sumanExitCode: constants.EXIT_CODES.FATAL_HOOK_ERROR,
            stack: '\t=> Fatal error in hook => (to continue even in the event of an error ' +
            'in a hook use option {fatal:false}) => ' + '\n' + formatedStk
          });
        }
      }
      else {
        // error handler called more than once, after first call, all we do is simply log the error
        _suman.writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
      }
    };

    d.on('error', handleError);

    process.nextTick(function () {

      const {sumanOpts} = _suman;

      if (sumanOpts.debug_hooks) {
        _suman.log(`now running all hook with name '${chalk.yellow(aBeforeOrAfter.desc)}'.`);
      }

      // need to d.run instead process.next so that errors thrown in same-tick get trapped by "Node.js domains in browser"
      // process.nextTick is necessary in the first place, so that async module does not experience Zalgo

      d.run(function runAllHook() {

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

        const t = makeHookObj(aBeforeOrAfter, assertCount, handleError);
        t.shared = self.shared;
        t.$inject = suman.$inject;
        t.desc = aBeforeOrAfter.desc;
        fini.th = t;
        t.timeout = timeout;
        t.fatal = function fatal(err: IPseudoError) {
          err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
          fini(err, null);
        };

        let arg;

        if (isGeneratorFn) {
          const handleGenerator = helpers.makeHandleGenerator(fini);
          arg = [freezeExistingProps(t)];
          handleGenerator(aBeforeOrAfter.fn, arg, aBeforeOrAfter.ctx);
        }
        else if (aBeforeOrAfter.cb) {

          t.callbackMode = true;

          // TODO: in the future, we may be able to check for presence of callback, if no callback, then fire error
          // if (!su.checkForValInStr(fnStr, /done/g)) {
          //    throw aBeforeOrAfter.NO_DONE;
          // }

          const dne = function done(err: IPseudoError) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(err);
            }
          };

          t.done = function done(err: IPseudoError) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(err);
            }
          };

          t.ctn = t.pass = function ctn(err: IPseudoError) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(null);
            }
          };

          arg = Object.setPrototypeOf(dne, freezeExistingProps(t));

          if (aBeforeOrAfter.fn.call(aBeforeOrAfter.ctx, arg)) {  //check to see if we have a defined return value
            _suman.writeTestError(cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
          }

        }
        else {
          const handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
          arg = freezeExistingProps(t);
          handlePotentialPromise(aBeforeOrAfter.fn.call(aBeforeOrAfter.ctx, arg), warn);
        }

      });

    });
  }
};
