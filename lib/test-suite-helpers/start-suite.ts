'use strict';
import {ITestDataObj} from "../../dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const async = require('async');

//project
const _suman = global.__suman = (global.__suman || {});
const implementationError = require('../helpers/implementation-error');
const makeTheTrap = require('./make-the-trap');

////////////////////////////////////////////////////////////////////////////////////

export = function (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function,
                    notifyParentThatChildIsComplete: Function) {

  const runTheTrap = makeTheTrap(suman, gracefulExit);

  return function startSuite(finished: Function) {

    const self = this;

    //TODO: if a child describe is only, but the parent is not, then we still need to run hooks for parent

    if (suman.describeOnlyIsTriggered && !this.only) {
      this.skippedDueToOnly = this.skipped = true;
    }

    const itOnlyIsTriggered = suman.itOnlyIsTriggered;

    async.series({

      runBefores: function _runBefores(cb: Function) {

        //TODO: need to look ahead to see if children are skipped too? Might be hard
        if (self.getChildren().length < 1 && self.skipped) {
          process.nextTick(cb);
        }
        else {
          //TODO: can probably prevent befores from running by checking self.tests.length < 1
          async.eachSeries(self.getBefores(), handleBeforesAndAfters, function complete(err: IPseudoError) {
            implementationError(err);
            process.nextTick(cb);
          });
        }
      },

      runTests: function _runTests(cb: Function) {

        let fn1 = self.parallel ? async.parallel : async.series;
        let fn2 = self.parallel ? async.each : async.eachSeries;

        fn1([
            function runPotentiallySerialTests(cb: Function) {
              fn2(self.getTests(), function (test: ITestDataObj, cb: Function) {
                if (self.skipped) {
                  test.skippedDueToParentSkipped = test.skipped = true;
                }
                if (self.skippedDueToOnly) {
                  test.skippedDueToParentOnly = test.skipped = true;
                }
                if (itOnlyIsTriggered && !test.only) {
                  test.skippedDueToItOnly = test.skipped = true;
                }
                runTheTrap(self, test, {
                  //TODO: what is this for LOL
                  parallel: false
                }, cb);
              }, function complete(err: IPseudoError) {
                implementationError(err);
                process.nextTick(cb);
              });

            },
            function runParallelTests(cb: Function) {

              const flattened = [{tests: self.getParallelTests()}];

              interface ITestSet {
                tests: Array<ITestDataObj>
              }

              fn2(flattened, function ($set: ITestSet, cb: Function) { //run all parallel sets in series
                async.each($set.tests, function (test: ITestDataObj, cb: Function) { //but individual sets of parallel tests can run in parallel
                  if (self.skipped) {
                    test.skippedDueToParentSkipped = test.skipped = true;
                  }
                  if (self.skippedDueToOnly) {
                    test.skippedDueToParentOnly = test.skipped = true;
                  }
                  if (itOnlyIsTriggered && !test.only) {
                    test.skippedDueToItOnly = test.skipped = true;
                  }
                  runTheTrap(self, test, {
                    parallel: true
                  }, cb);
                }, function done(err: IPseudoError) {
                  implementationError(err);
                  process.nextTick(cb);
                });
              }, function done(err: IPseudoError, results: Array<any>) {
                implementationError(err);
                process.nextTick(cb, null, results);
              });
            }
          ],
          function doneWithAllDescribeBlocks(err: IPseudoError, results: Array<any>) {
            implementationError(err);
            process.nextTick(cb, null, results);
          });

      },
      runAfters: function _runAfters(cb: Function) {
        if (self.getChildren().length < 1 && !self.skipped && !self.skippedDueToOnly) {
          async.eachSeries(self.getAfters(), handleBeforesAndAfters, function complete(err: IPseudoError) {
            implementationError(err);
            process.nextTick(cb);
          });
        } else {
          process.nextTick(cb);
        }
      }

    }, function allDone(err: IPseudoError, results: Array<any>) {
      implementationError(err);
      if (self.getChildren().length < 1 && self.parent) {
        notifyParentThatChildIsComplete(self.parent.testId, self.testId, function () {
          process.nextTick(finished);
        });
      } else {
        process.nextTick(finished);
      }
    });

  };
};
