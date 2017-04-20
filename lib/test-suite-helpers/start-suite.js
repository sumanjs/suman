'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var async = require('async');
var _suman = global.__suman = (global.__suman || {});
var implementationError = require('../helpers/implementation-error');
var makeTheTrap = require('./make-the-trap');
module.exports = function (suman, gracefulExit, handleBeforesAndAfters, notifyParentThatChildIsComplete) {
    var runTheTrap = makeTheTrap(suman, gracefulExit);
    return function startSuite(finished) {
        var self = this;
        if (suman.describeOnlyIsTriggered && !this.only) {
            this.skippedDueToOnly = this.skipped = true;
        }
        var itOnlyIsTriggered = suman.itOnlyIsTriggered;
        async.series({
            runBefores: function _runBefores(cb) {
                if (self.getChildren().length < 1 && self.skipped) {
                    process.nextTick(cb);
                }
                else {
                    async.eachSeries(self.getBefores(), handleBeforesAndAfters, function complete(err) {
                        implementationError(err);
                        process.nextTick(cb);
                    });
                }
            },
            runTests: function _runTests(cb) {
                var fn1 = self.parallel ? async.parallel : async.series;
                var fn2 = self.parallel ? async.each : async.eachSeries;
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
                                parallel: false
                            }, cb);
                        }, function complete(err) {
                            implementationError(err);
                            process.nextTick(cb);
                        });
                    },
                    function runParallelTests(cb) {
                        var flattened = [{ tests: self.getParallelTests() }];
                        fn2(flattened, function ($set, cb) {
                            async.each($set.tests, function (test, cb) {
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
                            }, function done(err) {
                                implementationError(err);
                                process.nextTick(cb);
                            });
                        }, function done(err, results) {
                            implementationError(err);
                            process.nextTick(cb, null, results);
                        });
                    }
                ], function doneWithAllDescribeBlocks(err, results) {
                    implementationError(err);
                    process.nextTick(cb, null, results);
                });
            },
            runAfters: function _runAfters(cb) {
                if (self.getChildren().length < 1 && !self.skipped && !self.skippedDueToOnly) {
                    async.eachSeries(self.getAfters(), handleBeforesAndAfters, function complete(err) {
                        implementationError(err);
                        process.nextTick(cb);
                    });
                }
                else {
                    process.nextTick(cb);
                }
            }
        }, function allDone(err, results) {
            implementationError(err);
            if (self.getChildren().length < 1 && self.parent) {
                notifyParentThatChildIsComplete(self.parent.testId, self.testId, function () {
                    process.nextTick(finished);
                });
            }
            else {
                process.nextTick(finished);
            }
        });
    };
};
