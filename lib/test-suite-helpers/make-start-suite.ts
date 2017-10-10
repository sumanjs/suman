'use strict';

//dts
import {IOnceHookObj} from "suman-types/dts/test-suite";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";
import {ITestDataObj} from "suman-types/dts/it";
import {ISuman, Suman} from "../suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
import async = require('async');
import su = require('suman-utils');
import chalk = require('chalk');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const implementationError = require('../helpers/implementation-error');
const {constants} = require('../../config/suman-constants');
const {makeTheTrap} = require('./make-the-trap');

////////////////////////////////////////////////////////////////////////////////////

interface ITestSet {
  tests: Array<ITestDataObj>
}

////////////////////////////////////////////////////////////////////////////////////

export const makeStartSuite = function (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function,
                                        notifyParentThatChildIsComplete: Function) {

  return function startSuite(finished: Function) {

    const self = this;
    const runTheTrap = makeTheTrap(suman, gracefulExit);
    const {sumanOpts, sumanConfig} = _suman;

    if (sumanOpts.series) {
      console.log('\n', su.padWithXSpaces(_suman.currentPaddingCount.val),
        chalk.underline.gray.bold.italic(`▶ ${self.desc} ▷ `));
    }


    //TODO: if a child describe is only, but the parent is not, then we still need to run hooks for parent
    if (suman.describeOnlyIsTriggered && !this.only) {
      this.skippedDueToOnly = this.skipped = true;
    }

    // important - push all afters "last" onto afters array
    this.mergeAfters();

    const q = suman.getQueue();
    let earlyCallback = Boolean(sumanOpts.parallel_max);

    q.push(function (queueCB: Function) {

      async.series({

        runBefores: function (cb: Function) {

          //TODO: can probably prevent befores from running by checking self.tests.length < 1

          // NOTE: we always run before hooks, even if
          async.eachSeries(self.getBefores(), function (aBeforeOrAfter: IOnceHookObj, cb: Function) {
            handleBeforesAndAfters(self, aBeforeOrAfter, cb);
          }, function complete(err: IPseudoError) {
            implementationError(err);
            process.nextTick(function () {
              earlyCallback && finished();
              cb();
            });
          });

        },

        runTests: function (cb: Function) {

          if (self.skipped || self.skippedDueToOnly) {
            // note: we don't run the tests if a block is skipped due to only
            return process.nextTick(cb);
          }

          let fn1 = (self.parallel && !sumanOpts.series) ? async.parallel : async.series;
          let fn2 = async.eachLimit; // formerly => let fn2 = self.parallel ? async.each : async.eachSeries;
          let limit = 1;

          if (self.parallel && !sumanOpts.series) {
            if (self.limit) {
              limit = Math.min(self.limit, constants.DEFAULT_PARALLEL_TEST_LIMIT);
            }
            else {
              limit = sumanConfig.DEFAULT_PARALLEL_TEST_LIMIT || constants.DEFAULT_PARALLEL_TEST_LIMIT;
            }
          }

          const condition = Number.isInteger(limit) && limit > 0 && limit < 91;
          assert(condition, 'limit must be an integer between 1 and 90, inclusive.');

          fn1([
              function runPotentiallySerialTests(cb: Function) {

                fn2(self.getTests(), limit, function (test: ITestDataObj, cb: Function) {

                    const itOnlyIsTriggered = suman.itOnlyIsTriggered;

                    if (self.skipped) {
                      test.skippedDueToParentSkipped = test.skipped = true;
                    }

                    if (self.skippedDueToOnly) {
                      test.skippedDueToParentOnly = test.skipped = true;
                    }

                    if (itOnlyIsTriggered && !test.only) {
                      test.skippedDueToItOnly = test.skipped = true;
                    }

                    // parallel is false because these are serial tests
                    runTheTrap(self, test, {parallel: false}, cb);
                  },

                  function complete(err: IPseudoError) {
                    implementationError(err);
                    process.nextTick(cb);
                  });

              },
              function runParallelTests(cb: Function) {

                const flattened = [{tests: self.getParallelTests()}];

                // => run all parallel sets in series
                fn2(flattened, limit, function ($set: ITestSet, cb: Function) {

                    // => but individual sets of parallel tests can run in parallel
                    async.each($set.tests, function (test: ITestDataObj, cb: Function) {

                        const itOnlyIsTriggered = suman.itOnlyIsTriggered;

                        if (self.skipped) {
                          test.skippedDueToParentSkipped = test.skipped = true;
                        }

                        if (self.skippedDueToOnly) {
                          test.skippedDueToParentOnly = test.skipped = true;
                        }

                        if (itOnlyIsTriggered && !test.only) {
                          test.skippedDueToItOnly = test.skipped = true;
                        }

                        // parallel is true because these are parallel tests
                        runTheTrap(self, test, {parallel: true}, cb);

                      },
                      function done(err: IPseudoError) {
                        implementationError(err);
                        process.nextTick(cb);
                      });
                  },
                  function done(err: IPseudoError, results: Array<any>) {
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
        runAfters: function (cb: Function) {

          if (self.afterHooksCallback) {
            return self.afterHooksCallback(cb);
          }

          if (!self.allChildBlocksCompleted && self.getChildren().length > 0) {
            self.couldNotRunAfterHooksFirstPass = true;
            // note: we only run the after hooks *here* if the block has no children
            // otherwise, we run any after hooks for a block by notifying a parent when a child has completed
            return process.nextTick(cb);
          }

          self.alreadyStartedAfterHooks = true;

          async.eachSeries(self.getAfters(), function (aBeforeOrAfter: IOnceHookObj, cb: Function) {
              handleBeforesAndAfters(self, aBeforeOrAfter, cb);
            },
            function complete(err: IPseudoError) {
              implementationError(err);
              notifyParentThatChildIsComplete(self, cb);
            });

        }

      }, function allDone(err: IPseudoError, results: Array<any>) {

        implementationError(err);

        // isCompleted means this block has completed, nothing more
        self.isCompleted = true;

        process.nextTick(function () {
          queueCB();
          // if earlyCallback is true, we have already called finished, cannot call it twice!
          !earlyCallback && finished();
        });

      });

    });

  };
};
