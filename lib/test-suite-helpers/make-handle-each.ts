'use strict';

//dts
import {IEachHookObj, IHandleError, ITestSuite} from "suman-types/dts/test-suite";
import {ISuman} from "suman-types/dts/suman";
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
import {cloneError} from '../misc/clone-error';
import {makeHookObj} from './t-proto-hook';
import {makeCallback} from './handle-callback-helper';

const helpers = require('./handle-promise-generator');
import {freezeExistingProps} from 'freeze-existing-props'

//////////////////////////////////////////////////////////////////////////////////////

export const makeHandleBeforeOrAfterEach = function (suman: ISuman, gracefulExit: Function) {

  return function handleBeforeOrAfterEach(self: ITestSuite, test: ITestDataObj, aBeforeOrAfterEach: IEachHookObj, cb: Function) {

    if (_suman.sumanUncaughtExceptionTriggered) {
      _suman.logError('runtime error => uncaughtException experienced => halting program.');
      return;
    }

    aBeforeOrAfterEach.alreadyInitiated = true;

    if (test.skipped || test.stubbed) {
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

    const fini = makeCallback(d, assertCount, null, aBeforeOrAfterEach, timerObj, gracefulExit, cb);
    const fnStr = aBeforeOrAfterEach.fn.toString();
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
        if (aBeforeOrAfterEach.fatal === false) {
          const msg = ' => Suman non-fatal error => Error in hook and "fatal" option for the hook ' +
            'is set to false => \n' + formatedStk;
          console.log('\n\n', msg, '\n\n');
          _suman.writeTestError(msg);
          fini(null);
        }
        else {
          //note we want to exit right away, that's why this is commented out :)
          err = new Error(' => fatal error in hook => (to continue even in the event of an error ' +
            'in a hook, use option {fatal:false}) =>' + '\n\n' + formatedStk);
          err.sumanFatal = true;
          err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
          gracefulExit(err);  //always fatal error in beforeEach/afterEach
        }
      }
      else {
        // after second call to error, that's about enough
        d.removeAllListeners();
        _suman.writeTestError(' => Suman error => Error in hook => \n' + stk);
      }
    };

    d.on('error', handleError);

    process.nextTick(function () {

      const {sumanOpts} = _suman;

      if (sumanOpts.debug_hooks) {
        _suman.log(`now running each hook with name '${chalk.yellow.bold(aBeforeOrAfterEach.desc)}', ` +
          `for test case with name '${chalk.magenta(test.desc)}'.`);
      }

      const sumanOpts = _suman.sumanOpts;

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

        const t = makeHookObj(aBeforeOrAfterEach, assertCount, handleError);
        fini.th = t;
        t.timeout = timeout;
        t.data = test.data;
        t.desc = test.desc;
        t.value = test.value;
        t.testId = test.testId;
        t.state = 'pending';
        t.shared = self.shared;
        t.$inject = suman.$inject;

        t.fatal = function fatal(err: IPseudoError) {
          if (!t.callbackMode) {
            handleNonCallbackMode(err);
          }
          else {
            err = err || new Error('Stand-in error, since user did not provide one.');
            err.sumanFatal = true;
            fini(err);
          }
        };

        let args;

        if (isGeneratorFn) {
          const handleGenerator = helpers.makeHandleGenerator(fini);
          args = [freezeExistingProps(t)];
          handleGenerator(aBeforeOrAfterEach.fn, args, aBeforeOrAfterEach.ctx);
        }
        else if (aBeforeOrAfterEach.cb) {

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
              err && (err.sumanFatal = Boolean(sumanOpts.bail));
              fini(err);
            }
          };

          t.done = function done(err: IPseudoError) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              err && (err.sumanFatal = Boolean(sumanOpts.bail));
              fini(err);
            }
          };

          t.ctn = t.pass = function () {
            // t.pass doesn't make sense since this is not a test case, but for user friendliness
            // this is like t.done() except by design no error will ever get passed
            if (!t.callbackMode) {
              handleNonCallbackMode(undefined);
            }
            else {
              fini(null);
            }
          };

          args = Object.setPrototypeOf(dne, freezeExistingProps(t));

          if (aBeforeOrAfterEach.fn.call(aBeforeOrAfterEach.ctx, args)) {
            _suman.writeTestError(cloneError(aBeforeOrAfterEach.warningErr,
              constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
          }
        }
        else {

          const handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
          args = freezeExistingProps(t);
          handlePotentialPromise(aBeforeOrAfterEach.fn.call(aBeforeOrAfterEach.ctx, args), false);
        }

      });

    });

  }

};
