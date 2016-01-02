/**
 * Created by amills001c on 11/24/15.
 */


//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production

//extra
var inDebugMode = typeof global.v8debug === 'object';
console.log('Are we debugging?', inDebugMode);


//#core
var async = require('async');
var _ = require('underscore');
var debug = require('debug')('suman');
var colors = require('colors/safe');

//#local
var makeGracefulExit = require('./make-graceful-exit');
var makeHandleTestErrors = require('./handle-test-error');
var handleExit = require('./handle-exit');
var handleArgs = require('./handle-args');
var incr = require('./incrementer');
var makeSuiteLite = require('./make-suite-lite');


module.exports = {

    main: function main(suman) {

        var errors = [];
        var testErrors = [];
        var allTests = [];

        var gracefulExit = makeGracefulExit(errors);
        var handleTestResult = makeHandleTestErrors(suman, testErrors);
        var TestSuite = require('./TestSuite')(suman, startSuite, allTests, gracefulExit);

        handleExit(suman, testErrors, errors);
        handleArgs(suman);


        function makeSuite(desc, cb) {

            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log('--grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                process.send({errors: [], msg: 'grepSuite didnt match desc', type: 'fatal', fatal: false});
                process.exit(0);
            }
            else {
                var suite = new TestSuite({desc: desc, isTopLevel: true});
                debug('suite is about to be applied:', suite.description);
                allTests.push(suite);
                try {

                    //var obj = suite;
                    var obj = makeSuiteLite(suite);

                    //var proto = obj.__proto__;
                    //
                    //for(var prop in proto){
                    //    try{
                    //        proto[prop] = proto[prop].bind(suite);
                    //    }
                    //    catch(err){
                    //        console.log(err);
                    //    }
                    //}

                    //for(var prop in obj){
                    //    if(obj.hasOwnProperty(prop)){
                    //        try{
                    //            obj[prop] = obj[prop].bind(suite);
                    //        }
                    //        catch(err){
                    //            console.log(err);
                    //        }
                    //    }
                    //}

                    cb.apply(obj, [{}]);
                }
                catch (err) {
                    console.error(err);
                    gracefulExit([err]);
                }
                finally {
                    suman.logData(suite); //note: this is imperative for getting testId=0 to be logged at all
                }

                debug('allTests.length', allTests.length);

                async.eachSeries(allTests, function (test, cb) {

                    debug('test is about to start:', test.description);

                    test.startSuite(function (err, results) {
                        debug('suite is done:', test.description);
                        suman.logData(test);
                        cb(null);
                    });

                }, function complete() {
                    process.exit();
                });

            }
        }


        function startSuite(finished) {

            var self = this;

            function handleBeforeOrAfterEach(test, aBeforeOrAfterEach, cb) {

                try {

                    if (aBeforeOrAfterEach.length < 1) {
                        aBeforeOrAfterEach.apply({
                            log: self.log,
                            currentTest: {
                                data: test.data,
                                desc: test.desc,
                                testId: test.testId
                            }
                        }, []);
                        cb(null);
                    }
                    else {
                        aBeforeOrAfterEach.apply({
                            log: self.log,
                            currentTest: {
                                data: test.data,
                                desc: test.desc,
                                testId: test.testId
                            }
                        }, [function (err) {
                            cb(null, err);
                        }]);
                    }

                }
                catch (err) {
                    cb(null, err);
                }

            }


            function handleTest(test, cb) {

                if (test.cb.length < 1) {
                    var error = null;
                    try {
                        test.cb.apply({
                            data: test.data,
                            desc: test.desc,
                            testId: test.testId
                        }, []);
                    }
                    catch (err) {
                        error = err;
                    }
                    finally {
                        handleTestResult(error, test);
                        cb(null, error);
                    }
                }
                else {

                    function makeCallback(err) {
                        if (timer) {
                            clearTimeout(timer);
                        }
                        handleTestResult(err, test);
                        cb(null, err);
                    }

                    var done = _.once(makeCallback);

                    try {

                        if (!inDebugMode) {
                            var err = new Error('timed out - ' + test.cb);
                            var timer = setTimeout(function () {
                                test.timedOut = true;
                                done(err);
                            }, 2000);
                        }

                        test.cb.apply({
                            data: test.data,
                            desc: test.desc,
                            testId: test.testId
                        }, [function (err) {
                            done(err);
                        }]);
                    }
                    catch (err) {
                        console.log(err.stack);
                        done(err);
                    }

                }
            }


            function handleBeforesAndAfters(aBeforeOrAfter, cb) {
                try {
                    if (aBeforeOrAfter.length < 1) {
                        aBeforeOrAfter.apply({
                            log: self.log.bind(self)
                        }, []);
                        cb(null);
                    }
                    else {
                        aBeforeOrAfter.apply({
                            log: self.log.bind(self)
                        }, [function (err) {
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
                        gracefulExit(results, function () {
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

                                    gracefulExit(results, function () {

                                        async.series([function (cb) {
                                            handleTest(test, cb);

                                        }, function (cb) {
                                            async.mapSeries(self.afterEaches, function (aAfterEach, cb) {
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
                        gracefulExit(results, function () {
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

