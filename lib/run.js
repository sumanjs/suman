/**
 * Created by amills001c on 11/24/15.
 */

//TODO: process.send is sync? use async messaging?
//TODO: use let for block-scope variables - see: http://es6-features.org/#BlockScopedVariables


//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production


//#core
var async = require('async');
var _ = require('underscore');
var debug_core = require('debug')('suman:core');
var debug_suman_test = require('debug')('suman:test');
var colors = require('colors/safe');
var domain = require('domain');


//#local
var ee = require('./ee');
var makeAllEaches = require('./get-all-eaches');
var makeGracefulExit = require('./make-graceful-exit');
var makeHandleTestResults = require('./handle-test-result');
var makeHandleUncaughtException = require('./handle-uncaught-exception');
var handleExit = require('./handle-exit');
var handleArgs = require('./handle-args');
var incr = require('./incrementer');
var makeSuiteLite = require('./make-suite-lite');
var handleExtraOpts = require('./handle-extra-opts');


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
        var handleTestResult = makeHandleTestResults(suman, testErrors);
        var ts = require('./TestSuite')(suman, startSuite, allTests, gracefulExit);
        var TestSuite = ts.TestSuite;

        var maxMem = suman.maxMem = {
            heapTotal: 0,
            heapUsed: 0
        };

        var interval = setInterval(function () {

            var m = process.memoryUsage();
            if (m.heapTotal > maxMem.heapTotal) {
                maxMem.heapTotal = m.heapTotal;
            }
            if (m.heapUsed > maxMem.heapUsed) {
                maxMem.heapUsed = m.heapUsed;
            }

        }, 5);


        function makeSuite(desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);

            desc = obj.desc;
            opts = obj.opts;
            cb = obj.cb;


            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log('--grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                process.send({errors: [], msg: 'grepSuite didnt match desc', type: 'fatal', fatal: false});
                process.exit(0);
            }
            else {
                var suite = new TestSuite({desc: desc, isTopLevel: true, parallel: opts.parallel});
                ts.bindExtras(suite, null);
                allTests.push(suite);
                try {
                    //var obj = makeSuiteLite(suite);
                    //var obj = suite;
                    //suite.cb = cb;
                    domain.create().on('error', function (err) {
                        console.error('domain error:', err.stack);
                    }).run(function () {
                        cb.apply(suite, [suite]);
                        suite.isSetupComplete = true;
                        ts.bindExtras(null, null);
                    });
                }
                catch (err) {
                    console.error(err.stack);
                    gracefulExit([err]);
                }
                finally {
                    suman.logData(suite); //note: this is imperative for getting testId=0 to be logged at all
                }

                if (!process.send) {
                    debug_core('attempting to run X number of tests...');
                }

                var count = 0;
                var num = allTests.length;

                ee.on('test_complete', function () {
                    count++;
                    if (count >= num) {
                        //process.exit();
                        //TODO: why would this be called if gracefulExit is called?
                        suman.makeExit();
                    }
                });

                async.eachSeries(allTests, function (test, cb) {

                    test.startSuite(function (err, results) {
                        debug_core('suite is done:', test.desc);
                        suman.logData(test);
                        cb(null);
                    });

                }, function complete() {
                    clearInterval(interval);
                    debug_core('all finished calls are done...');
                    /*
                     if(inDebugMode){
                     process.exit();
                     }
                     */
                });

            }
        }


        function startSuite(finished) {

            var self = this;

            if (this.skip) {
                throw new Error('skip in startSuite should not happen');
                return finished();
            }

            if (suman.describeOnlyIsTriggered && !this.only) {
                debug_core('startSuite: describeOnlyIsTriggered && and this describe is not an only, so skipped:' + this.desc);
                return finished();
            }


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


                debug_suman_test(aBeforeOrAfterEach.type + (aBeforeOrAfterEach.desc ? ':' + aBeforeOrAfterEach.desc : '') + ' - test desc: ' + test.desc);


                //TODO: if an error happens in beforeEach/afterEach we should fail immediately

                function makeCallback(err) {
                    clearTimeout(timer);
                    cb(null, err);
                }

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    done(aBeforeOrAfterEach.timeOutError);
                }, timeout);

                domain.create()
                    .on('error', function (err) {
                        //this.exit();
                        done(err);
                    })
                    .run(function () {
                        try {
                            if (aBeforeOrAfterEach.length < 1) {
                                aBeforeOrAfterEach.apply(self, []);
                                done(null);
                            }
                            else if (aBeforeOrAfterEach.length < 2) {
                                aBeforeOrAfterEach.apply(self, [{
                                    log: self.log,
                                    data: test.data,
                                    desc: test.desc,
                                    testId: test.testId
                                }]);
                                done(null);
                            }
                            else {
                                aBeforeOrAfterEach.apply(self, [{
                                    log: self.log,
                                    data: test.data,
                                    desc: test.desc,
                                    testId: test.testId
                                }, function (err) {
                                    done(err);
                                }]);
                            }
                        }
                        catch (err) {
                            done(err);
                        }
                    });

            }


            //TODO: fn.apply with undefined instead of fn.apply with null
            //TODO: done callbacks can only be called once

            function handleTest(test, cb) {

                function makeCallback(err) {
                    clearTimeout(timer);
                    cb(null, err);
                }

                function handlePotentialPromise(val) {
                    if (val) {
                        Promise.resolve(val).then(function () {
                            done(null);
                        }).catch(function (err) {
                            done(err);
                        });
                    }
                    else {
                        done(null);
                    }
                }

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    test.timedOut = true;
                    done(test.cb.timeOutError);
                }, timeout);

                domain.create().on('error', function (err) {
                    if (err.sumanFatal) {
                        gracefulExit([err]);
                    }
                    else {
                        done(err);
                    }
                }).run(function () {

                    try {

                        /*var args = test.cb.toString()
                         .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
                         .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
                         .split(/,/);

                         console.log('args:',args);*/

                        if (test.cb.length < 1) {
                            handlePotentialPromise(test.cb.apply(self, []));
                        }
                        else if (test.cb.length < 2) {

                            handlePotentialPromise(test.cb.apply(self, [{
                                data: test.data,
                                desc: test.desc,
                                testId: test.testId
                            }]));
                        }
                        else {

                            test.cb.apply(self, [{
                                data: test.data,
                                desc: test.desc,
                                testId: test.testId
                            }, function (err) {
                                done(err);
                            }]);
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

                        //TODO: thrown Errors in before/after each do not behave congruently (test4.js)
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

                debug_suman_test(aBeforeOrAfter.type + (aBeforeOrAfter.desc ? ':' + aBeforeOrAfter.desc : ''));

                function makeCallback(err) {
                    clearTimeout(timer);
                    cb(null, err);
                }

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    done(aBeforeOrAfter.timeOutError);
                }, timeout);


                domain.create().on('error', function (err) {

                    //d.exit();
                    done(err);

                }).run(function () {

                    try {
                        if (aBeforeOrAfter.length < 1) {
                            aBeforeOrAfter.apply(self, []);
                            done(null);
                        }
                        //else if (aBeforeOrAfter.length < 2) {
                        //    aBeforeOrAfter.apply(self, [{
                        //        desc: self.desc,
                        //        log: self.log.bind(self)
                        //    }]);
                        //    cb(null);
                        //}
                        else {
                            aBeforeOrAfter.apply(self, [
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

            //TODO make beforeEach run before each it();
            //TODO make beforeEach run before each it();
            //TODO Change to return suite and test for each callback

            async.series([
                function runBefores(cb) {
                    async.mapSeries(self.befores, handleBeforesAndAfters, function complete(err, results) {
                        gracefulExit(results, function () {
                            if (self.parent && self.parent.parallel /*self.parallel*/) {
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
                                    cb(null, results);
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
                        ee.emit('test_complete');
                        finished();
                    });
                }
                else {
                    ee.emit('test_complete');
                    finished();
                }
            });

        }


        return makeSuite;
    }
};

