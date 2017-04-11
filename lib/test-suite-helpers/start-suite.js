'use strict';

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

module.exports = function (suman, gracefulExit, handleBeforesAndAfters, notifyParentThatChildIsComplete) {

  const runTheTrap = makeTheTrap(suman, gracefulExit);

  return function startSuite(finished) {

    const self = this;

    //TODO: if a child describe is only, but the parent is not, then we still need to run hooks for parent

    if (suman.describeOnlyIsTriggered && !this.only) {
      this.skippedDueToOnly = this.skipped = true;
    }

    const itOnlyIsTriggered = suman.itOnlyIsTriggered;

    async.series({

      runBefores: function _runBefores(cb) {

        //TODO: need to look ahead to see if children are skipped too? Might be hard
        if (self.getChildren().length < 1 && self.skipped) {
          process.nextTick(cb);
        }
        else {
          //TODO: can probably prevent befores from running by checking self.tests.length < 1
          async.mapSeries(self.getBefores(), handleBeforesAndAfters, function complete(err, results) {
            implementationError(err);
            process.nextTick(cb);
          });
        }
      },

      runTests: function _runTests(cb) {

        let fn1 = self.parallel ? async.parallel : async.series;
        let fn2 = self.parallel ? async.each : async.eachSeries;

        fn1([
            function runPotentiallySerialTests(cb) {
              fn2(self.getTests(), function (test, cb) {
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
              }, function complete(err, results) {
                implementationError(err);
                process.nextTick(cb);
              });

            },
            function runParallelTests(cb) {

              const flattened = [{tests: self.getParallelTests()}];

              fn2(flattened, function ($set, cb) { //run all parallel sets in series
                async.each($set.tests, function (test, cb) { //but individual sets of parallel tests can run in parallel
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
                }, function done(err, results) {
                  implementationError(err);
                  process.nextTick(cb);
                });
              }, function done(err, results) {
                implementationError(err);
                process.nextTick(function(){
                  cb(null, results);
                });

              });
            }
          ],
          function doneWithallDescribeBlocks(err, results) {
            implementationError(err);
            process.nextTick(function(){
              cb(null, results);
            });
          });

      },
      runAfters: function _runAfters(cb) {
        if (self.getChildren().length < 1 && !self.skipped && !self.skippedDueToOnly) {
          async.mapSeries(self.getAfters(), handleBeforesAndAfters, function complete(err, results) {
            implementationError(err);
            process.nextTick(cb);
          });
        } else {
          process.nextTick(cb);
        }
      }

    }, function allDone(err, results) {
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
