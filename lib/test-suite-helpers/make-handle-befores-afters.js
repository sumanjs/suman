'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const domain = require('domain');
const assert = require('assert');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');
const fnArgs = require('function-arguments');
const debug_core = require('suman-debug')('suman:core');
const debugSumanTest = require('suman-debug')('suman:test');
const makeCallback = require('./handle-callback-helper');
const helpers = require('./handle-promise-generator');
const constants = require('../../config/suman-constants');
const cloneError = require('../clone-error');
const makeHookObj = require('../t-proto-hook');
const freezeExistingProps = require('../freeze-existing');

/////////////////////////////////////////////////////////////////////////////////////

module.exports = function (suman, gracefulExit) {

  return function handleBeforesAndAfters(aBeforeOrAfter, cb) {

    if (_suman.sumanUncaughtExceptionTriggered) {
      console.error(' => Suman runtime error => "UncaughtException:Triggered" => halting program.');
      return;
    }

    const timerObj = {
      timer: setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : aBeforeOrAfter.timeout)
    };

    const assertCount = {
      num: 0
    };

    const d = domain.create();
    d._sumanBeforeAfter = true;
    d._sumanBeforeAfterDesc = aBeforeOrAfter.desc || '(unknown)';

    const fini = makeCallback(d, assertCount, null, aBeforeOrAfter, timerObj, gracefulExit, cb);
    const fnStr = aBeforeOrAfter.fn.toString();

    function onTimeout() {
      fini(cloneError(aBeforeOrAfter.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
    }

    //TODO: need to add more info to logging statement below and also handle if fatal:false
    let dError = false;

    function handleError(err) {

      const stk = err ? (err.stack || err) : new Error('Suman error placeholder').stack;
      const formatedStk = String(stk).split('\n').map(item => '\t' + item).join('\n');

      if (!dError) {
        dError = true;
        clearTimeout(timerObj.timer);
        if (aBeforeOrAfter.fatal === false) {
          _suman._writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
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
        _suman._writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
      }
    }

    d.on('error', handleError);

    process.nextTick(function () {

      // need to d.run instead process.next so that errors thrown in same-tick get trapped by "Node.js domains in browser"
      // process.nextTick is necessary in the first place, so that async module does not experience Zalgo

      d.run(function () {

        let warn = false;

        if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
          warn = true;
        }

        const isGeneratorFn = su.isGeneratorFn(aBeforeOrAfter.fn);

        function timeout(val) {
          clearTimeout(timerObj.timer);
          timerObj.timer = setTimeout(onTimeout, _suman.weAreDebugging ? 5000000 : val);
        }

        function handleNonCallbackMode(err) {
          err = err ? ('Also, you have this error => ' + err.stack || err) : '';
          handleError(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
        }

        const HookObj = makeHookObj(aBeforeOrAfter, assertCount);
        const t = new HookObj(handleError);

        fini.th = t;
        t.timeout = timeout;

        t.fatal = function fatal(err) {
          err = err || new Error('Suman placeholder error since this function was not explicitly passed an error object as first argument.');
          fini(err);
        };

        let arg;

        if (isGeneratorFn) {

          if (aBeforeOrAfter.cb) {
            throw new Error('Generator function callback also asking for done param => inconsistent.');
          }
          const handleGenerator = helpers.makeHandleGenerator(fini);
          arg = [freezeExistingProps(t)];
          handleGenerator(aBeforeOrAfter.fn, arg, aBeforeOrAfter.ctx);
        }
        else if (aBeforeOrAfter.cb) {

          t.callbackMode = true;

          //if (!sumanUtils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
          //    throw aBeforeOrAfter.NO_DONE;
          //}

          const d = function done(err) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(err);
            }
          };

          t.done = function done(err) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(err);
            }
          };

          t.ctn = function ctn(err) {
            if (!t.callbackMode) {
              handleNonCallbackMode(err);
            }
            else {
              fini(null);
            }

          };

          arg = Object.setPrototypeOf(d, freezeExistingProps(t));

          if (aBeforeOrAfter.fn.call(aBeforeOrAfter.ctx, arg)) {  //check to see if we have a defined return value
            _suman._writeTestError(cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
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
