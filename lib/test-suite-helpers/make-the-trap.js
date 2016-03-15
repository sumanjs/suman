/**
 * Created by denman on 3/13/2016.
 */


//#core
const domain = require('domain');

//#npm
const async = require('async');
const parseFunction = require('parse-function');
const debugCore = require('debug')('suman:core');
const debugSumanTest = require('debug')('suman:test');

//#project
const makeHandleTestResults = require('./handle-test-result');
const makeHandleTest = require('./handle-test');
const makeAllEaches = require('../get-all-eaches');
const makeHandleBeforeOrAfterEach = require('./make-handle-each');


module.exports = function makeTheTrap(suman, allTests, gracefulExit, testErrors) {

    const handleTestResult = makeHandleTestResults(suman, testErrors);
    const handleTest = makeHandleTest(suman, gracefulExit);
    const allEachesHelper = makeAllEaches(suman, allTests);
    const handleBeforeOrAfterEach = makeHandleBeforeOrAfterEach(suman, gracefulExit);

    return function runTheTrap(self, test, opts, cb) {

        var delaySum = 0; //TODO: is this correct?

        //TODO: why not run only check earlier?
        if (suman.itOnlyIsTriggered && !test.only) {
            return cb(null, []);   //TODO: add skipped call
        }

        var parallel = opts.parallel;

        var arr = allEachesHelper.getAllBeforesEaches(self);
        async.mapSeries(arr, function (aBeforeEach, cb) {
                handleBeforeOrAfterEach(self, test, aBeforeEach, cb);
            },
            function doneWithBeforeEaches(err, results) {

                gracefulExit(results, function () {

                    if (parallel) {
                        delaySum += (test.delay || 0);
                    } else {
                        delaySum = 0;
                    }

                    async.series([
                        function (cb) {
                            const d = domain.create();
                            d._sumanSeries = true;
                            d.on('error', function (err) {
                                console.error(err.stack);
                            });

                            d.run(function () {
                                function handleTestContainer() {
                                    handleTest(self, test, function (err, result) {
                                        handleTestResult(result, test);
                                        cb(null, result);
                                    });
                                }

                                if (delaySum) { // non-zero value
                                    setTimeout(handleTestContainer, delaySum);
                                }
                                else {
                                    handleTestContainer();
                                }
                            });


                        }, function (cb) {
                            var arr = allEachesHelper.getAllAfterEaches(self);
                            async.mapSeries(arr, function (aAfterEach, cb) {
                                handleBeforeOrAfterEach(self, test, aAfterEach, cb);
                            }, function done(err, results) {
                                gracefulExit(results, function () {
                                    cb(null);
                                });
                            });

                        }], function doneWithTests(err, results) {
                        cb(null, results);
                    })
                });
            });
    }

};