'use strict';
import {IHandleError, ITestDataObj, ITestSuite} from "../../dts/test-suite";
import {IGlobalSumanObj, IPseudoError} from "../../dts/global";
import {ISuman} from "../../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');
import EE = require('events');

//npm
const fnArgs = require('function-arguments');
import {events} from 'suman-events';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');
import su = require('suman-utils');
import {makeCallback} from './handle-callback-helper';
const helpers = require('./handle-promise-generator');
import {cloneError} from '../misc/clone-error';
import {makeTestCase} from './t-proto-test';
import {freezeExistingProps} from 'freeze-existing-props'
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

/////////////////////////////////////////////////////////////////////////////////////

export const makeHandleTest = function (suman: ISuman, gracefulExit: Function) {

  return function _handleTest(self: ITestSuite, test: ITestDataObj, cb: Function) {

    //records whether a test was actually attempted
    test.alreadyInitiated = true;

    if (_suman.sumanUncaughtExceptionTriggered) {
      _suman.logError(`runtime error => "UncaughtException:Triggered" => halting program.\n[${__filename}]`);
      return;
    }

    if (test.stubbed) {
      resultBroadcaster.emit(String(events.TEST_CASE_END), test);
      resultBroadcaster.emit(String(events.TEST_CASE_STUBBED), test);
      return process.nextTick(cb);
    }

    if (test.skipped) {
      resultBroadcaster.emit(String(events.TEST_CASE_END), test);
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED), test);
      return process.nextTick(cb);
    }

    const onTimeout = function () {
      test.timedOut = true;
      const err = cloneError(test.warningErr, constants.warnings.TEST_CASE_TIMED_OUT_ERROR);
      err.isFromTest = true;
      fini(err, true);
    };

    const timerObj = {
      timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : test.timeout)
    };

    const d = domain.create();
    d._sumanTest = true;
    d._sumanTestName = test.desc;

    const assertCount = {
      num: 0
    };

    const fnStr = test.fn.toString();
    const fini = makeCallback(d, assertCount, test, null, timerObj, gracefulExit, cb);

    let derror = false;

    const handleErr: IHandleError = function (err: IPseudoError) {

      /*
       note: we need to call done in same tick instead of in nextTick
       otherwise it can be called by another location
       */

      const stack = err ? (err.stack || err) : new Error('Suman placeholder error.').stack;
      // const formattedStk = String(stk).split('\n').map(item => '\t' + item).join('\n');

      if (!derror) {
        derror = true;
        fini({stack});
      }
      else {
        // after second call to error, that's about enough
        // d.removeAllListeners();
        // d.exit()  should take care of removing listeners
        _suman._writeTestError(' => Suman error => Error in test => \n' + stack);
      }
    };

    d.on('error', handleErr);

    d.run(function () {

      process.nextTick(function () {

        let warn = false;
        let isAsyncAwait = false;

        if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
          //TODO: this check needs to get updated, async functions should return promises implicitly
          warn = true;
        }

        const isGeneratorFn = su.isGeneratorFn(test.fn);

        function timeout(val: number) {
          timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 500000 : val);
        }

        function $throw(str: any) {
          handleErr(str instanceof Error ? str : new Error(str));
        }

        function handle(fn: Function) {
          try {
            fn.call(self);
          }
          catch (e) {
            handleErr(e);
          }
        }

        function handleNonCallbackMode(err: IPseudoError) {
          err = err ? ('Also, you have this error => ' + err.stack || err) : '';
          handleErr(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
        }

        const TestCase = makeTestCase(test, assertCount);
        const t = new TestCase(handleErr);

        fini.th = t;
        t.handleAssertions = handle;
        t.throw = $throw;
        t.timeout = timeout;
        t.shared = self.shared;
        t.$inject = suman.$inject;

        ////////////// note: unfortunately these fns cannot be moved to prototype /////////////////

        t.fatal = function fatal(err: IPseudoError) {
          if (!t.callbackMode) {
            handleNonCallbackMode(err);
          }
          else {
            err = err || new Error('t.fatal() was called by the developer.');
            err.sumanFatal = true;
            fini(err);
          }
        };

        ////////////////////////////////////////////////////////////////////////////////////////////

        test.dateStarted = Date.now();

        let args;

        if (isGeneratorFn) {
          const handleGenerator = helpers.makeHandleGenerator(fini);
          if (test.cb === true) {
            throw new Error('Generator function callback is also asking for callback mode => inconsistent.');
          }
          args = [freezeExistingProps(t)];
          handleGenerator(test.fn, args, self);
        }
        else if (test.cb === true) {

          t.callbackMode = true;

          const d = function done(err: Error) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(err);
            }
          };

          fini.th = d;

          t.done = function done(err: Error) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(err);
            }
          };

          t.pass = t.ctn = function pass() {
            if (!t.callbackMode) {
              handleNonCallbackMode(undefined);
            }
            else {
              fini();
            }

          };

          t.fail = function fail(err: Error) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(err || new Error('t.fail() was called on test (note that null/undefined value ' +
                  'was passed as first arg to the fail function.)'));
            }
          };

          args = Object.setPrototypeOf(d, freezeExistingProps(t));
          if (test.fn.call(self, args)) {  ///run the fn, but if it returns something, then add warning
            _suman._writeTestError(cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
          }

        }
        else {
          const handlePotentialPromise = helpers.handlePotentialPromise(fini, fnStr);
          args = freezeExistingProps(t);
          handlePotentialPromise(test.fn.call(self, args), warn);
        }

      });

    });

  }
};

///////////// support node style imports //////////////////////////////////////////////////

let $exports = module.exports;
export default $exports;

//////////////////////////////////////////////////////////////////////////////////////////
