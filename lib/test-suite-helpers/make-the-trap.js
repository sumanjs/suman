'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require('domain');
var async = require('async');
var _suman = global.__suman = (global.__suman || {});
var makeHandleTestResults = require('./handle-test-result');
var makeHandleTest = require('./handle-test');
var makeAllEaches = require('./get-all-eaches');
var makeHandleBeforeOrAfterEach = require('./make-handle-each');
var implementationError = require('../helpers/implementation-error');
module.exports = function makeTheTrap(suman, gracefulExit) {
    var allDescribeBlocks = suman.allDescribeBlocks;
    var handleTest = makeHandleTest(suman, gracefulExit);
    var handleTestResult = makeHandleTestResults(suman);
    var allEachesHelper = makeAllEaches(suman, allDescribeBlocks);
    var handleBeforeOrAfterEach = makeHandleBeforeOrAfterEach(suman, gracefulExit);
    return function runTheTrap(self, test, opts, cb) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            console.error(' => Suman runtime error => "UncaughtException:Triggered" => halting program.');
            return;
        }
        var delaySum = 0;
        if (test.skipped || test.stubbed) {
            process.nextTick(function () {
                cb(null, []);
            });
            return;
        }
        var parallel = opts.parallel;
        async.eachSeries(allEachesHelper.getAllBeforesEaches(self), function (aBeforeEach, cb) {
            handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
        }, function doneWithBeforeEaches(err) {
            implementationError(err);
            if (parallel) {
                delaySum += (test.delay || 0);
            }
            else {
                delaySum = 0;
            }
            async.series([
                function (cb) {
                    function handleTestContainer() {
                        handleTest(self, test, function (err, result) {
                            implementationError(err);
                            gracefulExit(handleTestResult(result, test), test, function () {
                                cb(null, result);
                            });
                        });
                    }
                    if (delaySum) {
                        setTimeout(handleTestContainer, delaySum);
                    }
                    else {
                        handleTestContainer();
                    }
                },
                function (cb) {
                    async.eachSeries(allEachesHelper.getAllAfterEaches(self), function (aAfterEach, cb) {
                        handleBeforeOrAfterEach(self, test, aAfterEach, cb);
                    }, function done(err) {
                        implementationError(err);
                        process.nextTick(cb);
                    });
                }
            ], function doneWithTests(err, results) {
                err && console.error(' => Suman implementation error => the following error should not be present => ', err);
                cb(null, results);
            });
        });
    };
};
