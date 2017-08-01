'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var async = require("async");
var su = require("suman-utils");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var implementationError = require('../helpers/implementation-error');
var constants = require('../../config/suman-constants').constants;
var makeTheTrap = require('./make-the-trap').makeTheTrap;
var getQueue = require('../helpers/job-queue').getQueue;
exports.makeStartSuite = function (suman, gracefulExit, handleBeforesAndAfters, notifyParentThatChildIsComplete) {
    var runTheTrap = makeTheTrap(suman, gracefulExit);
    return function startSuite(finished) {
        var self = this;
        var sumanOpts = _suman.sumanOpts;
        if (sumanOpts.series) {
            console.log('\n');
            console.log(su.padWithXSpaces(_suman.currentPaddingCount.val), chalk.gray.bold.italic(self.desc));
        }
        if (suman.describeOnlyIsTriggered && !this.only) {
            this.skippedDueToOnly = this.skipped = true;
        }
        this.mergeAfters();
        var itOnlyIsTriggered = suman.itOnlyIsTriggered;
        var q = getQueue();
        q.push(function (queueCB) {
            async.series({
                runBefores: function _runBefores(cb) {
                    if (self.getChildren().length < 1 && self.skipped) {
                        process.nextTick(cb);
                    }
                    else {
                        async.eachSeries(self.getBefores(), function (aBeforeOrAfter, cb) {
                            handleBeforesAndAfters(self, aBeforeOrAfter, cb);
                        }, function complete(err) {
                            implementationError(err);
                            process.nextTick(cb);
                        });
                    }
                },
                runTests: function _runTests(cb) {
                    var fn1 = (self.parallel && !sumanOpts.series) ? async.parallel : async.series;
                    var fn2 = async.eachLimit;
                    var limit = 1;
                    if (self.parallel && !sumanOpts.series) {
                        if (self.limit) {
                            limit = Math.min(self.limit, 90);
                        }
                        else {
                            limit = _suman.sumanConfig.DEFAULT_PARALLEL_TEST_LIMIT || constants.DEFAULT_PARALLEL_TEST_LIMIT;
                        }
                    }
                    assert(Number.isInteger(limit) && limit > 0 && limit < 91, 'limit must be an integer between 1 and 90, inclusive.');
                    fn1([
                        function runPotentiallySerialTests(cb) {
                            fn2(self.getTests(), limit, function (test, cb) {
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
                            fn2(flattened, limit, function ($set, cb) {
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
                        async.eachSeries(self.getAfters(), function (aBeforeOrAfter, cb) {
                            handleBeforesAndAfters(self, aBeforeOrAfter, cb);
                        }, function complete(err) {
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
                    notifyParentThatChildIsComplete(self.parent, self, function () {
                        process.nextTick(function () {
                            queueCB();
                            finished();
                        });
                    });
                }
                else {
                    process.nextTick(function () {
                        queueCB();
                        finished();
                    });
                }
            });
        });
    };
};
