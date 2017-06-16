'use strict';
import {ITestDataObj} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";
import {IPseudoError} from "../../dts/global";

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
const {constants} = require('../../config/suman-constants');
const {makeTheTrap} = require('./make-the-trap');
const {getQueue} = require('../helpers/job-queue');

////////////////////////////////////////////////////////////////////////////////////

export const makeStartSuite = function (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function,
                                        notifyParentThatChildIsComplete: Function) {

  const runTheTrap = makeTheTrap(suman, gracefulExit);

  return function startSuite(finished: Function) {

    const self = this;

    //TODO: if a child describe is only, but the parent is not, then we still need to run hooks for parent
    if (suman.describeOnlyIsTriggered && !this.only) {
      this.skippedDueToOnly = this.skipped = true;
    }

    // important - push all afterAlways onto afters array
    this.mergeAfters();

    const itOnlyIsTriggered = suman.itOnlyIsTriggered;

    const q = getQueue();

    q.push(function (queueCB: Function) {

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
          let fn2 = async.eachLimit;
          // let fn2 = self.parallel ? async.each : async.eachSeries;

          let limit = 1;

          if (self.parallel) {
            if (self.limit) {
              limit = Math.min(self.limit, 300);
            }
            else {
              limit = _suman.sumanConfig.DEFAULT_PARALLEL_TEST_LIMIT || constants.DEFAULT_PARALLEL_TEST_LIMIT;
            }
          }

          fn1([
              function runPotentiallySerialTests(cb: Function) {
                fn2(self.getTests(), limit, function (test: ITestDataObj, cb: Function) {
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

                // => run all parallel sets in series
                fn2(flattened, limit, function ($set: ITestSet, cb: Function) {
                  // => but individual sets of parallel tests can run in parallel
                  async.each($set.tests, function (test: ITestDataObj, cb: Function) {
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
            process.nextTick(function(){
              queueCB();
              finished();
            });
          });
        } else {
          process.nextTick(function(){
            queueCB();
            finished();
          });
        }
      });

    });

  };
};
