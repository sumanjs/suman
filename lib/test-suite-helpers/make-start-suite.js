'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var EE = require("events");
var async = require("async");
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var general_1 = require("../helpers/general");
var suman_constants_1 = require("../../config/suman-constants");
var make_the_trap_1 = require("./make-the-trap");
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeStartSuite = function (suman, gracefulExit, handleBeforesAndAfters, notifyParentThatChildIsComplete) {
    return function startSuite(finished) {
        var self = this;
        var runTheTrap = make_the_trap_1.makeTheTrap(suman, gracefulExit);
        var sumanOpts = suman.opts, sumanConfig = suman.config;
        if (sumanOpts.series) {
            rb.emit(String(suman_events_1.events.SUMAN_CONTEXT_BLOCK), self);
        }
        if (suman.describeOnlyIsTriggered && !this.only) {
            this.skippedDueToOnly = this.skipped = true;
        }
        this.mergeBefores();
        this.mergeAfters();
        var q = suman.getQueue();
        var earlyCallback = Boolean(sumanOpts.parallel_max);
        q.push(function (queueCB) {
            async.series({
                runBefores: function (cb) {
                    async.eachSeries(self.getBefores(), function (aBeforeOrAfter, cb) {
                        handleBeforesAndAfters(self, aBeforeOrAfter, cb);
                    }, function complete(err) {
                        general_1.implementationError(err);
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
                    var limit = 1;
                    if (self.parallel && !sumanOpts.series) {
                        if (self.limit) {
                            limit = Math.min(self.limit, suman_constants_1.constants.DEFAULT_PARALLEL_TEST_LIMIT);
                        }
                        else {
                            limit = sumanConfig.DEFAULT_PARALLEL_TEST_LIMIT || suman_constants_1.constants.DEFAULT_PARALLEL_TEST_LIMIT;
                        }
                    }
                    var condition = Number.isInteger(limit) && limit > 0 && limit < 91;
                    assert(condition, 'limit must be an integer between 1 and 90, inclusive.');
                    fn1([
                        function runPotentiallySerialTests(cb) {
                            async.eachLimit(self.getTests(), limit, function (test, cb) {
                                var itOnlyIsTriggered = suman.itOnlyIsTriggered;
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
                                general_1.implementationError(err);
                                process.nextTick(cb);
                            });
                        },
                        function runParallelTests(cb) {
                            async.eachLimit(self.getParallelTests(), limit, function (test, cb) {
                                var itOnlyIsTriggered = suman.itOnlyIsTriggered;
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
                                general_1.implementationError(err);
                                process.nextTick(cb, null);
                            });
                        }
                    ], function doneWithAllDescribeBlocks(err, results) {
                        general_1.implementationError(err);
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
                    self.alreadyStartedAfterHooks = true;
                    async.eachSeries(self.getAfters(), function (aBeforeOrAfter, cb) {
                        handleBeforesAndAfters(self, aBeforeOrAfter, cb);
                    }, function complete(err) {
                        general_1.implementationError(err);
                        notifyParentThatChildIsComplete(self, cb);
                    });
                }
            }, function allDone(err, results) {
                general_1.implementationError(err);
                self.isCompleted = true;
                process.nextTick(function () {
                    queueCB();
                    !earlyCallback && finished();
                });
            });
        });
    };
};
