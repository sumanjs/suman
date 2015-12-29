/**
 * Created by amills001c on 11/24/15.
 */


//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production


//#core
var async = require('async');
var _ = require('underscore');
var debug = require('debug')('suman');
var colors = require('colors/safe');

//#local
var handleExit = require('./handle-exit');
var handleArgs = require('./handle-args');
var incr = require('./incrementer');


module.exports = {

    main: function (suman) {

        var errors = [];
        var testErrors = [];
        var allTests = [];

        var ParallelTestSet = require('./ParallelTestSet.js')(suman);
        var LoopTestSet = require('./LoopTestSet.js')(suman);
        var TestSuite = require('./TestSuite')(suman, startSuite, allTests);


        handleExit(suman, testErrors, errors);
        handleArgs(suman);


        function makeSuite(desc, cb) {

            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log('--grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                process.send({errors: [], msg: 'grepSuite didnt match desc', fatal: false});
                process.exit(0);
            }
            else {
                var suite = new TestSuite({desc: desc, isTopLevel: true});
                console.log('suite is about to be applied:', suite.description);
                allTests.push(suite);
                try {
                    cb.apply(suite, [suite]);
                }
                catch (err) {
                    console.error(err);
                }

                console.log('allTests.length', allTests.length);

                async.eachSeries(allTests, function (test, cb) {

                    console.log('test is about to start:', test.description);

                    test.startSuite(function (err, results) {
                        console.log('suite is done:', test.description);
                        suman.logErrors(suite); //note: this is imperative for getting testId=0 to be logged at all
                        cb(null);
                    });

                }, function complete() {
                    process.exit();
                });

            }
        }

        function makeGracefulExitOrNot(errs, cb) {

            errs = errs.filter(function (err) {
                if (err instanceof Error) {
                    console.error(err.stack);
                    return err;
                }
                else if (!err) {
                    return undefined;
                }
                else {
                    console.error(colors.bgRed('non error passed'));
                    return undefined;
                }
            }).map(function (err) {
                return err.message;
            });

            if (errs && errs.length > 0) {
                console.log('omg!!! errors:', errs);
                errs.forEach(function (err) {
                    errors.push(err);
                });
                process.exit();
            }
            else {
                cb();
            }

        }

        function makeError(err, test) {
            if (err) {
                test.error = err.message;
                testErrors.push(test.error);
            }
            else {
                test.error = null;
            }
        }


        function startSuite(finished) {

            var self = this;

            function handleBeforeOrAfterEach(test, aBeforeOrAfterEach, cb) {

                try {

                    if (aBeforeOrAfterEach.length < 1) {
                        aBeforeOrAfterEach.apply(self, []);
                        self.currentTest = null;
                        cb(null);
                    }
                    else {
                        self.currentTest = test;
                        aBeforeOrAfterEach.apply(self, [function (err) {
                            self.currentTest = null;
                            cb(null, err);
                        }]);
                    }

                }
                catch (err) {
                    self.currentTest = null;
                    cb(null, err);
                }

            }


            function handleTest(test, cb) {

                if (test.cb.length < 1) {
                    try {
                        test.cb.apply(self, []);
                        suman.logErrors(test);
                        cb(null);
                    }
                    catch (err) {
                        makeError(err, test);
                        suman.logErrors(test);
                        cb(null, err);
                    }
                }
                else {
                    try {

                        var timer = setTimeout(function () {
                            test.timedOut = true;
                            makeError(new Error('timed out'), test);
                            suman.logErrors(test);
                            cb(null);

                        }, 2000);

                        test.cb.apply(self, [function (err) {
                            if (!test.timedOut) {
                                clearTimeout(timer);
                                makeError(err, test);
                                suman.logErrors(test);
                                cb(null, err);
                            }
                        }]);
                    }
                    catch (err) {
                        makeError(err, test);
                        suman.logErrors(test);
                        console.error('caught error in:', err);
                        cb(null, err);
                    }
                }
            }


            function handleBeforesAndAfters(aBeforeOrAfter, cb) {
                try {
                    if (aBeforeOrAfter.length < 1) {
                        aBeforeOrAfter.apply(self, []);
                        cb(null);
                    }
                    else {
                        aBeforeOrAfter.apply(self, [function (err) {
                            cb(null, err);
                        }]);
                    }
                }
                catch (err) {
                    cb(null, err);
                }
            }


            async.series([
                function runBefores(cb) {
                    async.mapSeries(self.befores, handleBeforesAndAfters, function complete(err, results) {
                        makeGracefulExitOrNot(results, function () {
                            return cb(null);
                        });
                    });
                },
                function runTests(cb) {

                    async.series([function (cb) {
                        async.eachSeries(self.tests, function (test, cb) {
                            async.mapSeries(self.beforeEaches, function (aBeforeEach, cb) {
                                    handleBeforeOrAfterEach(test, aBeforeEach, cb);
                                },
                                function doneWithBeforeEaches(err, results) {

                                    makeGracefulExitOrNot(results, function () {

                                        async.series([function (cb) {
                                            handleTest(test, cb);

                                        }, function (cb) {
                                            async.mapSeries(self.afterEaches, function (aAfterEach, cb) {
                                                handleBeforeOrAfterEach(test, aAfterEach, cb);
                                            }, function done(err, results) {
                                                makeGracefulExitOrNot(results, function () {
                                                    cb(null);
                                                });
                                            });

                                        }], function doneWithTests(err, results) {
                                            cb(null, results);
                                        })
                                    });
                                });

                        }, function complete(err, results) {
                            cb(null, results);
                        });

                    }, function (cb) {
                        async.eachSeries(self.testsParallel, function ($set, cb) { //run all parallel sets in series
                            async.each($set.tests, handleTest, //but individual sets of parallel tests can run in parallel
                                function done(err, results) {
                                    cb(null, results)
                                });
                        }, function done(err, results) {
                            cb(null, results);
                        });
                    }, function (cb) {
                        async.eachSeries(self.loopTests, function ($set, cb) { //run all parallel sets in series
                            async.each($set.tests, handleTest,  //but individual sets of parallel tests can run in parallel
                                function done(err, results) {
                                    cb(null, results)
                                });
                        }, function done(err, results) {
                            cb(null, results);
                        });

                    }], function doneWithAllTests(err, results) {
                        cb(null, results);
                    });

                },
                function runAfters(cb) {
                    async.mapSeries(self.afters, handleBeforesAndAfters, function complete(err, results) {
                        makeGracefulExitOrNot(results, function () {
                            cb(null);
                        });
                    });
                }

            ], function allDone(err, results) {
                finished();
            });

        }


        return makeSuite;
    }
};

