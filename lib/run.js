/**
 * Created by amills001c on 11/24/15.
 */

//TODO: you should removing blocking action WRT sending data to server and just block on the server using writeSync
//TODO: use let for block-scope variables - see: http://es6-features.org/#BlockScopedVariables
//TODO: need to warn users if they place a done without a t in a test or beforeEach/afterEach
//TODO: we know which file or directory the user is running their tests, so error stack traces should only contain those paths
//TODO: if firefox or whatever default browser the user declares is closed (no open windows) we should always open to results page?

//TODO: for any node.js process require('suman').Test should not be called more than once

//Test.describe can be called multiple times, but require('suman').Test really just needs to be called once

//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production


//#core
const async = require('async');
const _ = require('underscore');
var debug_core = require('debug')('suman:core');
var debug_suman_test = require('debug')('suman:test');
//var colors = require('colors/safe');
const chalk = require('chalk');
const domain = require('domain');
const path = require('path');
const assert = require('assert');


//#project
const utils = require('./utils');
const ee = require('./ee');
const makeAllEaches = require('./get-all-eaches');
const makeHandleUncaughtException = require('./handle-uncaught-exception')();
const makeGracefulExit = require('./make-graceful-exit');
const makeHandleTestResults = require('./handle-test-result');
const handleExit = require('./handle-exit');
const handleArgs = require('./handle-args');
const incr = require('./incrementer');
const makeSuiteLite = require('./make-suite-lite');
const makeHandleExtraOpts = require('./handle-extra-opts');


module.exports = {

    main: function main(suman) {

        var errors = [];
        var testErrors = [];
        var allTests = [];

        handleExit(suman, testErrors, errors);
        handleArgs(suman);

        var handleExtraOpts = makeHandleExtraOpts(suman);
        var gracefulExit = makeGracefulExit(suman, errors);
        var allEaches = makeAllEaches(suman, allTests);
        var handleTestResult = makeHandleTestResults(suman, testErrors);
        var ts = require('./TestSuite')(suman, startSuite, allTests, gracefulExit);
        var TestSuite = ts.TestSuite;

        var maxMem = suman.maxMem = {
            heapTotal: 0,
            heapUsed: 0
        };

        var interval = suman.config.checkMemoryUsage ? setInterval(function () {

            var m = process.memoryUsage();
            if (m.heapTotal > maxMem.heapTotal) {
                maxMem.heapTotal = m.heapTotal;
            }
            if (m.heapUsed > maxMem.heapUsed) {
                maxMem.heapUsed = m.heapUsed;
            }

        }, 5) : null;


        function makeSuite(desc, opts, deps, cb) {

            var obj = handleExtraOpts.handleOptsWithDeps(desc, opts, deps, cb);

            desc = obj.desc;
            opts = obj.opts;
            deps = obj.deps;
            cb = obj.cb;

            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log('--grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                process.send({errors: [], msg: 'grepSuite didnt match desc', type: 'FATAL', fatal: false});
                process.exit(0);
            }
            else {

                if(deps.length > 0){
                    if(suman.config.ioc){
                        var ioc = require(path.resolve(suman.config.ioc));
                        ioc(suman, function (err, deps) {
                            if (err) {
                                throw err;
                            }
                            else {
                                assert(Array.isArray(deps),'deps from IoC is not an array.');
                                startWholeShebang(deps);
                            }
                        });
                    }
                    else{
                        throw new Error('No IoC path');
                    }
                }
                else{
                    startWholeShebang([]);
                }

                function startWholeShebang(deps){
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
                            debug_core('suite is about to be applied: ' + suite.desc);
                            //cb.apply(suite, [suite]);
                            if (cb.length < 1) {
                                cb.apply(suite, []);
                                suite.isSetupComplete = true;
                                suite.invokeChildren(start);  //pass start function all the way through program until last child delay call is invoked!
                            }
                            else {
                                suite.isDelayed = true;
                                cb.apply(suite, [function delay(err) {
                                    process.nextTick(function () {  //need to make sure delay is called asynchronously, but this should take care of it
                                        suite.isSetupComplete = true;
                                        suite.invokeChildren(start);  //pass start function all the way through program until last child delay call is invoked!
                                    });
                                }]);
                            }

                            //ts.bindExtras(null, null);
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
                }


                var count = 0;
                var num = allTests.length;

                var toggle = true;

                ee.on('test_complete', function handleCompleteTest() {
                    count++;
                    console.log("COUNT:", count, '(allTests.length):', allTests.length);
                    if (count >= num) {   //TODO: why is count off by one?
                        //process.exit();
                        clearTimeout(to);
                        //TODO: log # of tests passed vs # of tests failed

                        //suman.makeExit();

                        if (toggle) {
                            toggle = false;
                            setTimeout(function () {
                                suman.makeExit();
                            }, 5000);
                        }

                    }
                });

                var to = setTimeout(function () { //TODO this timer should be unnecessary
                    process.exit('Test process timed out after 5000 seconds.');
                }, 5000000);

                function start() {
                    async.eachSeries(allTests, function (test, cb) {

                        process.nextTick(function () {  //this process.nextTick is prob unnecessary
                            test.startSuite(function (err, results) {
                                debug_core('suite/test is done:', test.desc);
                                suman.logData(test);
                                cb(null);
                            });
                        });

                    }, function complete() {
                        clearInterval(interval);
                        debug_core('all finished calls are done...');
                    });
                }
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
                //TODO do we need to call "ee.emit('test_complete')" ?
                return finished();
            }


            //TODO: what is purpose of this again??
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

                var d;

                function makeCallback(err) {

                    try {
                        if (err) {
                            err.sumanFatal = true; //fatal because it's in a before/after each
                        }
                        clearTimeout(timer);
                        d.exit(); //domain is most likely undefined at this point, not sure why
                    }
                    catch (err) {
                        //process.stderr.write(String(err));
                    }
                    finally {
                        cb(null, err);
                    }
                }

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    done(aBeforeOrAfterEach.timeOutError);
                }, timeout);

                d = domain.create()
                    .on('error', function (err) {
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
                                if (!utils.checkForValInStr(aBeforeOrAfterEach.toString(), /done/g)) {
                                    throw aBeforeOrAfterEach.NO_DONE;
                                }
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


            function handleTest(test, cb) {

                var d;

                function makeCallback(err) {
                    try {
                        clearTimeout(timer);
                        d.exit();  //domain is most likely undefined at this point, not sure why
                    }
                    catch (err) {
                        //process.stderr.write(err);
                    }
                    finally {
                        cb(null, err);
                    }

                }

                function handlePotentialPromise(val, warn) {

                    if (!val && warn) {
                        process.stdout.write('\nSuman warning: you may have forgotten to return a Promise from this test.\n');
                    }

                    Promise.resolve(val).then(function () {
                        done(null);
                    }).catch(function (err) {
                        done(err);
                    });
                }

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    test.timedOut = true;
                    done(test.cb.timeOutError);
                }, timeout);

                d = domain.create().on('error', function (err) {
                    if (err.sumanFatal) {
                        this.exit(); //extra handle for exiting domain
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
                        var warn = false;
                        if (test.cb.toString().toUpperCase().indexOf('PROMISE') > 0) {
                            warn = true;
                        }

                        if (test.cb.length < 1) {
                            handlePotentialPromise(test.cb.apply(self, []), warn);
                        }
                        else if (test.cb.length < 2) {
                            handlePotentialPromise(test.cb.apply(self, [{
                                data: test.data,
                                desc: test.desc,
                                testId: test.testId
                            }]), warn);
                        }
                        else {
                            if (!utils.checkForValInStr(test.cb.toString(), /done/g)) {
                                throw test.cb.NO_DONE;
                            }
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

            var delaySum = 0;

            function runTheTrap(test, opts, cb) {

                var parallel = opts.parallel;

                var arr = allEaches.getAllBeforesEaches(self);
                async.mapSeries(arr, function (aBeforeEach, cb) {
                        handleBeforeOrAfterEach(test, aBeforeEach, cb);
                    },
                    function doneWithBeforeEaches(err, results) {

                        //TODO: thrown Errors in before/after each do not behave congruently (test4.js)
                        gracefulExit(results, function () {

                            if (parallel) {
                                delaySum += (test.delay || 0);
                            }
                            else {
                                delaySum = 0;
                            }

                            async.series([function (cb) {
                                setTimeout(function () {  //if test.delay is defined, we use setTimeout
                                    handleTest(test, function (err, result) {
                                        handleTestResult(result, test);
                                        cb(null, result);
                                    });
                                }, delaySum || 0);

                                debug_core('delaySum:', delaySum);

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


            //TODO: befores afters and before eaches before afters need to handle promises too
            function handleBeforesAndAfters(aBeforeOrAfter, cb) {

                debug_suman_test(aBeforeOrAfter.type + (aBeforeOrAfter.desc ? ':' + aBeforeOrAfter.desc : ''));

                var d;  //d

                function makeCallback(err) {
                    try {
                        if (err) {
                            err.sumanFatal = true; //fatal because it's in a before/after each
                        }
                        clearTimeout(timer);
                        d.exit();  //domain is undefined at this point, not sure why
                    }
                    catch (err) {
                        //process.stderr.write(String(err));
                    }
                    finally {
                        cb(null, err);
                    }
                }

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    done(aBeforeOrAfter.timeOutError);
                }, timeout);


                d = domain.create().on('error', function (err) {
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
                            if (!utils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
                                throw aBeforeOrAfter.NO_DONE;
                            }
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

                    fn1([function runPotentiallySerialTests(cb) {  //TODO why are they merely "potentially" serial, aren't they always serial?
                            fn2(self.tests, function (test, cb) {
                                runTheTrap(test, {parallel: false}, cb);
                            }, function complete(err, results) {
                                cb(null, results);
                            });

                        }, function runParallelTests(cb) {
                            var flattened = _.flatten([self.testsParallel, self.loopTests], true).concat([{tests: self.parallelTests}]);
                            fn2(flattened, function ($set, cb) { //run all parallel sets in series
                                async.each($set.tests, function (test, cb) { //but individual sets of parallel tests can run in parallel
                                    runTheTrap(test, {parallel: true}, cb);
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

