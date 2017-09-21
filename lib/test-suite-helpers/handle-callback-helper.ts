'use strict';
import {IAssertObj, IHookObj, ITimerObj} from "../../dts/test-suite";
import {IGlobalSumanObj, IPseudoError, ISumanDomain} from "../../dts/global";
import {ITestDataObj} from "../../dts/it";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');
import assert = require('assert');

//npm
import su from 'suman-utils';

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');
import {cloneError} from '../misc/clone-error';

/////////////////////////////////////////////////////////////////////////////////////////

function missingHookOrTest() {
  const mzg = new Error(' => Suman implementation error, please report! ' +
    'Neither test nor hook defined, where at least one should be.');
  console.error(mzg.stack);
  _suman.writeTestError(mzg.stack);
  return mzg;
}

function planHelper(e: IPseudoError, test: ITestDataObj, hook: IHookObj, assertCount: IAssertObj) {

  const testOrHook: ITestDataObj | IHookObj = (test || hook);

  if (testOrHook.planCountExpected !== undefined) {
    assert(Number.isInteger(testOrHook.planCountExpected),
      ' => Suman usage error => "plan" option must be an integer.');
  }

  if (Number.isInteger(testOrHook.planCountExpected) && testOrHook.planCountExpected !== assertCount.num) {

    testOrHook.errorPlanCount = 'Error => Expected plan count was ' + testOrHook.planCountExpected +
      ' but actual assertion/confirm count was ' + assertCount.num;

    const newErr = cloneError(testOrHook.warningErr, testOrHook.errorPlanCount);

    if (e) {
      e = new Error(su.getCleanErrStr(e) + '\n' + newErr.stack);
    }
    else {
      e = newErr;
    }
  }

  return e;

}

function throwsHelper(err: IPseudoError, test: ITestDataObj, hook: IHookObj) {

  const testOrHook: ITestDataObj | IHookObj = (test || hook);

  if (testOrHook.throws !== undefined) {

    assert(testOrHook.throws instanceof RegExp, ' => Suman usage error => "throws" option must be a RegExp.');

    let z;
    if (!err) {

      z = testOrHook.didNotThrowErrorWithExpectedMessage =
        'Error => Expected to throw an error matching regex (' + testOrHook.throws + ') , but did not.';

      err = cloneError(testOrHook.warningErr, z);

      if (hook) {
        err.sumanFatal = true;
        err.sumanExitCode = constants.EXIT_CODES.HOOK_DID_NOT_THROW_EXPECTED_ERROR;
      }

    }
    else if (err && !String(err.stack || err).match(testOrHook.throws)) {

      z = testOrHook.didNotThrowErrorWithExpectedMessage =
        'Error => Expected to throw an error matching regex (' + testOrHook.throws + ') , but did not.';

      let newErr = cloneError(testOrHook.warningErr, z);

      err = new Error(err.stack + '\n' + newErr.stack);

    }
    else {
      // err matches expected error, so we can ignore error now
      err = null;
    }

  }
  return err;
}

export const makeCallback = function (d: ISumanDomain, assertCount: IAssertObj, test: ITestDataObj, hook: IHookObj,
                                      timerObj: ITimerObj, gracefulExit: Function, cb: Function) {

  if (test && hook) {
    throw new Error('Suman internal implementation error => Please report this on the Github issue tracker.');
  }
  else if (!test && !hook) {
    let msg = new Error(' => Suman implementation error, please report! ' +
      'Neither test nor hook defined, where at least one should be.');
    console.error(msg.stack || msg);
    _suman.writeTestError(msg.stack || msg);
  }

  let called = 0;

  return function testAndHookCallbackHandler(err: IPseudoError, isTimeout?: boolean) {

    if (err) {

      if (String(err.stack || err).match(/Suman usage error/)) {
        err.sumanFatal = true;
        err.sumanExitCode = constants.EXIT_CODES.ASYCNCHRONOUS_REGISTRY_OF_TEST_BLOCK_METHODS;
        gracefulExit(err);
        return;
      }

      if (Array.isArray(err)) {
        err = new Error(err.map(e => (e.stack || (typeof e === 'string' ? e : util.inspect(e)))).join('\n\n'));
      }
      else {
        err = typeof err === 'object' ? err : new Error(typeof err === 'string' ? err : util.inspect(err));
      }

      //TODO: need to make timeout error distinguishable for hooks or test
      err.isTimeoutErr = isTimeout || false;
    }

    if (++called === 1) {

      try {
        if (test || hook) {
          err = planHelper(err, test, hook, assertCount);
          err = throwsHelper(err, test, hook);
        }
        else {
          throw missingHookOrTest();
        }

      }
      catch ($err) {
        err = $err;
      }

      if (testAndHookCallbackHandler.th) {
        testAndHookCallbackHandler.th.emit('done', err);
        testAndHookCallbackHandler.th.removeAllListeners();
      }
      else {
        throw new Error(' => Suman internal implementation error => Please report this!');
      }

      try {
        d.exit(); //TODO: this removed to allow for errors thrown *after* tests/hooks are called-back
      }
      catch (err) {
        err && _suman.logError(err.stack || err);
      }

      clearTimeout(timerObj.timer);

      if (err) {

        //TODO: can probably change check for type into simply a check for hook == null and test == null
        err.sumanFatal = err.sumanFatal || !!((hook && hook.fatal !== false) || _suman.sumanOpts.bail);

        if (test) {
          test.error = err;
        }

        if (_suman.sumanOpts.bail) {
          if (test) {
            err.sumanExitCode = constants.EXIT_CODES.TEST_ERROR_AND_BAIL_IS_TRUE;
          }
          else if (hook) {
            err.sumanExitCode = constants.EXIT_CODES.HOOK_ERROR_AND_BAIL_IS_TRUE;
          }
          else {
            throw missingHookOrTest();
          }
        }
      }
      else {
        if (test) {
          test.complete = true;
          test.dateComplete = Date.now();
        }
      }

      if (test) {
        process.nextTick(cb, null, err);
      }
      else {
        gracefulExit(err, function () {
          process.nextTick(cb, null, err);
        });
      }

    }
    else {

      if (err) {
        _suman.writeTestError(err.stack || err);
      }

      // important note: the following logic says: the original callback should only be fired more than once if
      // it is due to a timeout firing *before* t.done/t.pass/t.fail etc.;
      // otherwise, we need to let the user know their code invoked the cb more than once using console.error
      // and possible fail the test, or add a warning

      if (called > 1 && test && !test.timedOut) {
        _suman.writeTestError('Warning: the following test callback was invoked twice by your code ' +
          'for the following test/hook with name => "' + (test ? test.desc : '') + '".');
        _suman.writeTestError('The problematic test case can be located from this error trace => \n' +
          cloneError(test.warningErr, 'The callback was fired more than once for this test case.').stack);
      }
      else if (called > 1 && hook) {  //TODO need to handle this case for hooks
        _suman.writeTestError('\n\nWarning: the following test callback was invoked twice by your code ' +
          'for the following hook with name => "' + (hook.desc || '(hook has no description)') + '".\n\n');
        _suman.writeTestError('The problematic hook can be located from this error trace => \n' +
          cloneError(hook.warningErr, 'The callback was fired more than once for this test case.').stack);
      }

    }

  }

};
