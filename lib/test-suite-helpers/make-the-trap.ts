'use strict';

//dts
import {ITestSuite} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {IPseudoError} from "suman-types/dts/global";
import {IItOpts, ITestDataObj} from "suman-types/dts/it";
import {IBeforeEachObj} from "suman-types/dts/before-each";
import {IAFterEachObj} from "suman-types/dts/after-each";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import * as async from 'async';
import {events} from 'suman-events';

//project
const _suman = global.__suman = (global.__suman || {});
const {makeHandleTestResults} = require('./handle-test-result');
const {makeHandleTest} = require('./make-handle-test');
const {getAllAfterEaches, getAllBeforesEaches} = require('./get-all-eaches');
import {makeHandleBeforeOrAfterEach} from './make-handle-each';
const implementationError = require('../helpers/implementation-error');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

////////////////////////////////////////////////////////////////////////////////

export const makeTheTrap = function (suman: ISuman, gracefulExit: Function) {

  const allDescribeBlocks = suman.allDescribeBlocks;
  const handleTest = makeHandleTest(suman, gracefulExit);
  const handleTestResult = makeHandleTestResults(suman);
  const handleBeforeOrAfterEach = makeHandleBeforeOrAfterEach(suman, gracefulExit);

  return function runTheTrap(self: ITestSuite, test: ITestDataObj, opts: IItOpts, cb: Function) {

    if (_suman.sumanUncaughtExceptionTriggered) {
      _suman.logError(`runtime error => "uncaughtException" event => halting program.\n[${__filename}]`);
      return;
    }

    const {sumanOpts, sumanConfig} = _suman;
    let delaySum = 0; //TODO: is this correct?

    if (test.stubbed) {
      resultBroadcaster.emit(String(events.TEST_CASE_END), test);
      resultBroadcaster.emit(String(events.TEST_CASE_STUBBED), test);
      return process.nextTick(cb, null);
    }

    if (test.skipped) {
      resultBroadcaster.emit(String(events.TEST_CASE_END), test);
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED), test);
      return process.nextTick(cb, null);
    }

    const parallel = sumanOpts.parallel || (opts.parallel && !_suman.sumanOpts.series);

    async.eachSeries(getAllBeforesEaches(self), function (aBeforeEach: IBeforeEachObj, cb: Function) {
        handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
      },
      function doneWithBeforeEaches(err: IPseudoError) {

        implementationError(err);

        if (parallel) {
          delaySum += (test.delay || 0);
        } else {
          delaySum = 0;
        }

        async.series([
            function (cb: Function) {

              function handleTestContainer() {
                handleTest(self, test, function (err: IPseudoError, result: any) {
                  implementationError(err);
                  let $result = handleTestResult(result, test);
                  if (sumanOpts.bail) {
                    gracefulExit($result, function () {
                      process.nextTick(cb, null, result);
                    });
                  }
                  else {
                    process.nextTick(cb, null, result);
                  }
                });
              }

              if (delaySum) { // if non-zero / non-falsy value
                setTimeout(handleTestContainer, delaySum);
              }
              else {
                handleTestContainer();
              }

            },

            function (cb: Function) {

              async.eachSeries(getAllAfterEaches(self), function (aAfterEach: IAFterEachObj, cb: Function) {
                handleBeforeOrAfterEach(self, test, aAfterEach, cb);
              }, function done(err: IPseudoError) {
                implementationError(err);
                process.nextTick(cb);
              });

            }
          ],
          function doneWithTests(err: IPseudoError, results: Array<any>) {
            err && console.error('Suman implementation error => the following error should not be present => ', err);
            cb(null, results);
          });

      });
  }

};
