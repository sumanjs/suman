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
    return function startSuite(finished) {
        var self = this;
        var runTheTrap = makeTheTrap(suman, gracefulExit);
        var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig;
        if (sumanOpts.series) {
            console.log('\n', su.padWithXSpaces(_suman.currentPaddingCount.val), chalk.underline('▽ ' + chalk.gray.bold.italic(self.desc)));
        }
        if (suman.describeOnlyIsTriggered && !this.only) {
            this.skippedDueToOnly = this.skipped = true;
        }
        this.mergeAfters();
        var itOnlyIsTriggered = suman.itOnlyIsTriggered;
        var q = getQueue();
        var earlyCallback = Boolean(sumanOpts.parallel_max);
        q.push(function (queueCB) {
            async.series({
                runBefores: function (cb) {
                    async.eachSeries(self.getBefores(), function (aBeforeOrAfter, cb) {
                        handleBeforesAndAfters(self, aBeforeOrAfter, cb);
                    }, function complete(err) {
                        implementationError(err);
                        process.nextTick(function () {
                            earlyCallback && finished();
                            cb();
                        });
                    });
                },
                runTests: function (cb) {
                    if (self.skipped || self.skippedDueToOnly) {
                        return process.nextTick(cb);
                    }
                    var fn1 = (self.parallel && !sumanOpts.series) ? async.parallel : async.series;
                    var fn2 = async.eachLimit;
                    var limit = 1;
                    if (self.parallel && !sumanOpts.series) {
                        if (self.limit) {
                            limit = Math.min(self.limit, constants.DEFAULT_PARALLEL_TEST_LIMIT);
                        }
                        else {
                            limit = sumanConfig.DEFAULT_PARALLEL_TEST_LIMIT || constants.DEFAULT_PARALLEL_TEST_LIMIT;
                        }
                    }
                    var condition = Number.isInteger(limit) && limit > 0 && limit < 91;
                    assert(condition, 'limit must be an integer between 1 and 90, inclusive.');
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
                                runTheTrap(self, test, { parallel: false }, cb);
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
                                    runTheTrap(self, test, { parallel: true }, cb);
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
                runAfters: function (cb) {
                    if (self.afterHooksCallback) {
                        return self.afterHooksCallback(cb);
                    }
                    if (!self.allChildBlocksCompleted && self.getChildren().length > 0) {
                        self.couldNotRunAfterHooksFirstPass = true;
                        return process.nextTick(cb);
                    }
                    Object.getPrototypeOf(self).alreadyStartedAfterHooks = true;
                    async.eachSeries(self.getAfters(), function (aBeforeOrAfter, cb) {
                        handleBeforesAndAfters(self, aBeforeOrAfter, cb);
                    }, function complete(err) {
                        implementationError(err);
                        notifyParentThatChildIsComplete(self, cb);
                    });
                }
            }, function allDone(err, results) {
                implementationError(err);
                Object.getPrototypeOf(self).isCompleted = true;
                process.nextTick(function () {
                    queueCB();
                    !earlyCallback && finished();
                });
            });
        });
    };
};
