'use strict';
import {IAFterEachObj, IBeforeEachObj, ITestDataObj, ITestSuite} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";
import {IPseudoError} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core

//npm
const async = require('async');

//project
const _suman = global.__suman = (global.__suman || {});
const makeHandleTestResults = require('./handle-test-result');
const makeHandleTest = require('./handle-test');
const makeAllEaches = require('./get-all-eaches');
const makeHandleBeforeOrAfterEach = require('./make-handle-each');
const implementationError = require('../helpers/implementation-error');

////////////////////////////////////////////////////////////////////////////////

export const makeTheTrap = function (suman: ISuman, gracefulExit: Function) {

  const allDescribeBlocks = suman.allDescribeBlocks;
  const handleTest = makeHandleTest(suman, gracefulExit);
  const handleTestResult = makeHandleTestResults(suman);
  const allEachesHelper = makeAllEaches(suman, allDescribeBlocks);
  const handleBeforeOrAfterEach = makeHandleBeforeOrAfterEach(suman, gracefulExit);

  return function runTheTrap(self: ITestSuite, test: ITestDataObj, opts: IItOpts, cb: Function) {

    if (_suman.sumanUncaughtExceptionTriggered) {
      console.error(' => Suman runtime error => "UncaughtException:Triggered" => halting program.');
      return;
    }

    let delaySum = 0; //TODO: is this correct?

    if (test.skipped || test.stubbed) {
      return process.nextTick(cb, null, []);
    }

    const parallel = opts.parallel;

    async.eachSeries(allEachesHelper.getAllBeforesEaches(self), function (aBeforeEach: IBeforeEachObj, cb: Function) {
        handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
      },
      function _doneWithBeforeEaches(err: IPseudoError) {

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
                  gracefulExit(handleTestResult(result, test), test, function () {
                    cb(null, result);
                  });
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

              async.eachSeries(allEachesHelper.getAllAfterEaches(self), function (aAfterEach: IAFterEachObj, cb: Function) {
                handleBeforeOrAfterEach(self, test, aAfterEach, cb);
              }, function done(err: IPseudoError) {
                implementationError(err);
                process.nextTick(cb);
              });

            }
          ],
          function doneWithTests(err: IPseudoError, results: Array<any>) {
            err && console.error(' => Suman implementation error => the following error should not be present => ', err);
            cb(null, results);
          });

      });
  }

};
