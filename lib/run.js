/**
 * Created by amills001c on 11/24/15.
 */

//TODO: process.send is sync? use async messaging?
//TODO: use let for block-scope variables - see: http://es6-features.org/#BlockScopedVariables


//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production

//extra
var inDebugMode = typeof global.v8debug === 'object';
if (!process.send) {
    console.log('Are we debugging?', inDebugMode);
}


//#core
var async = require('async');
var _ = require('underscore');
var debug = require('debug')('suman');
var colors = require('colors/safe');
var domain = require('domain');

//#local
var makeAllEaches = require('./get-all-eaches');
var makeGracefulExit = require('./make-graceful-exit');
var makeHandleTestErrors = require('./handle-test-error');
var makeHandleUncaughtException = require('./handle-uncaught-exception');
var handleExit = require('./handle-exit');
var handleArgs = require('./handle-args');
var incr = require('./incrementer');
var makeSuiteLite = require('./make-suite-lite');


module.exports = {

    main: function main(suman) {

        var errors = [];
        var testErrors = [];
        var allTests = [];

        handleExit(suman, testErrors, errors);
        handleArgs(suman);

        var handleUncaughtException = makeHandleUncaughtException(suman, testErrors, errors);
        var gracefulExit = makeGracefulExit(errors);
        var allEaches = makeAllEaches(suman, allTests);
        var handleTestResult = makeHandleTestErrors(suman, testErrors);
        var ts = require('./TestSuite')(suman, startSuite, allTests, gracefulExit);
        var TestSuite = ts.TestSuite;


        function makeSuite(desc, cb) {

            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log('--grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                process.send({errors: [], msg: 'grepSuite didnt match desc', type: 'fatal', fatal: false});
                process.exit(0);
            }
            else {
                var suite = new TestSuite({desc: desc, isTopLevel: true});
                ts.bindDescribeExtras(suite);
                ts.bindItExtras(suite);
                allTests.push(suite);
                try {
                    //var obj = makeSuiteLite(suite);
                    var obj = suite;
                    suite.cb = cb;
                    suite.cb.apply(obj, [obj]);
                    ts.bindDescribeExtras(suman.ctx.currentCtx);
                    ts.bindItExtras(suman.ctx.currentCtx);
                }
                catch (err) {
                    console.error(err);
                    gracefulExit([err]);
                }
                finally {
                    suman.logData(suite); //note: this is imperative for getting testId=0 to be logged at all
                }

                if (!process.send) {
                    console.log('attempting to run X number of tests...');
                }

                async.eachSeries(allTests, function (test, cb) {

                    test.startSuite(function (err, results) {
                        debug('suite is done:', test.description);
                        suman.logData(test);
                        cb(null);
                    });

                }, function complete() {
                    debug('all finished calls are done...');
                    //process.exit();
                });

            }
        }


        function startSuite(finished) {

            var self = this;

            function notifyParentThatChildIsComplete(parentTestId, childTestId, cb) {

                var parent = null;

                for (var i = 0; i < allTests.length; i++) {
                    var temp = allTests[i];
                    if (temp.testId === parentTestId) {
                        parent = temp;
                        break;
                    }
                }

                if (parent) {

                    var lastChild = parent.children[parent.children.length - 1];
                    if (lastChild.testId === childTestId) {
                        async.mapSeries(parent.afters, handleBeforesAndAfters, function complete(err, results) {
                            gracefulExit(results, function () {
                                if (parent.parent) {
                                    notifyParentThatChildIsComplete(parent.parent.testId, parent.testId, cb);
                                }
                                else {
                                    cb(null);
                                }
                            });
                        });
                    }
                    else {
                        cb(null);
                    }

                }
                else {
                    throw new Error('this should not happen...');
                }
            }

            function handleBeforeOrAfterEach(test, aBeforeOrAfterEach, cb) {

                cb = _.once(cb);

                domain.create()
                    .on('error', function (err) {
                        //d.exit();
                        cb(null, err);
                    })
                    .run(function () {

                        try {

                            if (aBeforeOrAfterEach.length < 1) {
                                aBeforeOrAfterEach.apply(test, []);
                                cb(null);
                            }
                            else if (aBeforeOrAfterEach.length < 2) {
                                aBeforeOrAfterEach.apply(test, [{
                                    log: self.log,
                                    currentTest: {
                                        data: test.data,
                                        desc: test.desc,
                                        testId: test.testId
                                    }
                                }]);
                                cb(null);
                            }
                            else {
                                aBeforeOrAfterEach.apply(test, [{
                                    log: self.log,
                                    currentTest: {
                                        data: test.data,
                                        desc: test.desc,
                                        testId: test.testId
                                    }
                                }, function (err) {
                                    cb(null, err);
                                }]);
                            }
                        }
                        catch (err) {
                            cb(null, err);
                        }
                    });

            }


            //TODO: fn.apply with undefined instead of fn.apply with null
            //TODO: done callbacks can only be called once

            function handleTest(test, cb) {

                function makeCallback(err) {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    cb(null, err);
                }

                var done = _.once(makeCallback);

                var d = domain.create();

                d.on('error', function (err) {
                    d.exit();
                    done(err);
                });

                var timer;

                d.run(function () {

                    try {

                        if (test.cb.length < 1) {
                            test.cb.apply(test, []);
                            done(null);
                        }
                        else if (test.cb.length < 2) {

                            test.cb.apply(test, [{
                                data: test.data,
                                desc: test.desc,
                                testId: test.testId
                            }]);

                            done(null);
                        }
                        else {

                            if (!inDebugMode) {
                                var err = new Error('timed out - ' + test.cb);
                                timer = setTimeout(function () {
                                    test.timedOut = true;
                                    done(err);
                                }, 5000);
                            }

                            test.cb.apply(test, [{
                                data: test.data,
                                desc: test.desc,
                                testId: test.testId
                            },
                                function (err) {
                                    done(err);
                                }
                            ]);
                        }
                    }
                    catch (err) {
                        done(err);
                    }
                });
            }

            function runTheTrap(test, cb) {

                var arr = allEaches.getAllBeforesEaches(self);
                async.mapSeries(arr, function (aBeforeEach, cb) {
                        handleBeforeOrAfterEach(test, aBeforeEach, cb);
                    },
                    function doneWithBeforeEaches(err, results) {

                        gracefulExit(results, function () {

                            async.series([function (cb) {
                                handleTest(test, function (err, result) {
                                    handleTestResult(result, test);
                                    cb(null, result);
                                });
                            }, function (cb) {
                                var arr = allEaches.getAllAfterEaches(self);
                                async.mapSeries(arr, function (aAfterEach, cb) {
                                    handleBeforeOrAfterEach(test, aAfterEach, cb);
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


            function handleBeforesAndAfters(aBeforeOrAfter, cb) {

                cb = _.once(cb);

                domain.create().on('error', function (err) {

                    d.exit();
                    cb(null, err);

                }).run(function () {

                    try {
                        if (aBeforeOrAfter.length < 1) {
                            aBeforeOrAfter.apply(self, []);
                            cb(null);
                        }
                        else if (aBeforeOrAfter.length < 2) {
                            aBeforeOrAfter.apply(self, [{
                                desc: self.desc,
                                log: self.log.bind(self)
                            }]);
                            cb(null);
                        }
                        else {
                            aBeforeOrAfter.apply(self, [{
                                desc: self.desc,
                                log: self.log.bind(self)
                            },
                                function (err) {
                                    cb(null, err);
                                }]);
                        }
                    }
                    catch (err) {
                        cb(null, err);
                    }
                });
            }

            //TODO make beforeEach run before each it();
            //TODO make beforeEach run before each it();
            //TODO Change to return suite and test for each callback

            async.series([
                function runBefores(cb) {
                    async.mapSeries(self.befores, handleBeforesAndAfters, function complete(err, results) {
                        gracefulExit(results, function () {
                            if (self.parallel) {
                                finished = _.once(finished);
                                setImmediate(function () {
                                    finished();
                                });
                            }
                            cb(null);
                        });
                    });
                },
                function runTests(cb) {

                    var fn1 = self.parallel ? async.parallel : async.series;
                    var fn2 = self.parallel ? async.each : async.eachSeries;

                    fn1([function runPotentiallySerialTests(cb) {
                            fn2(self.tests, function (test, cb) {
                                runTheTrap(test, cb);
                            }, function complete(err, results) {
                                cb(null, results);
                            });

                        }, function runParallelTests(cb) {
                            var flattened = _.flatten([self.testsParallel, self.loopTests], true).concat([{tests: self.parallelTests}]);
                            fn2(flattened, function ($set, cb) { //run all parallel sets in series
                                async.each($set.tests, function (test, cb) { //but individual sets of parallel tests can run in parallel
                                    runTheTrap(test, cb);
                                }, function done(err, results) {
                                    cb(null, results)
                                });
                            }, function done(err, results) {
                                cb(null, results);
                            });
                        }],
                        function doneWithAllTests(err, results) {
                            cb(null, results);
                        });

                },
                function runAfters(cb) {
                    if (self.children.length < 1) {
                        async.mapSeries(self.afters, handleBeforesAndAfters, function complete(err, results) {
                            gracefulExit(results, function () {
                                cb(null);
                            });
                        });
                    }
                    else {
                        cb(null);
                    }
                }

            ], function allDone(err, results) {
                if (self.children.length < 1 && self.parent) {
                    notifyParentThatChildIsComplete(self.parent.testId, self.testId, function () {
                        finished();
                    });
                }
                else {
                    finished();
                }
            });

        }


        return makeSuite;
    }
};

