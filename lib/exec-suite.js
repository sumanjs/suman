/**
 * Created by amills001c on 11/24/15.
 */


//TODO: as we know which file or directory the user is running their tests, so error stack traces should only contain those paths
//TODO: for any node.js process require('suman').init should not be called more than once
//TODO: Test.describe can be called multiple times, but require('suman').Test really just needs to be called once
//TODO: if there is an assertion error or whatever, we need to call done ourselves, or tell the test to stop timing out

//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production
//TODO: plugins http://hapijs.com/tutorials/plugins

process.on('uncaughtException', function (err) {
    var msg = err.stack || err;
    console.error(msg);
    if (process.send) {
        process.send({
            error: msg,
            msg: msg,
            type: 'FATAL',
            fatal: true
        });
    }
});


//#core
const domain = require('domain');
const path = require('path');
const assert = require('assert');


//#npm
const async = require('async');
const _ = require('underscore');
const parseFunction = require('parse-function');
const chalk = require('chalk');


//#project
const constants = require('../config/suman-constants');
const debug_core = require('debug')('suman:core');
const debug_suman_test = require('debug')('suman:test');
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

            const obj = handleExtraOpts.handleOptsWithDeps(desc, opts, deps, cb);

            desc = obj.desc;
            opts = obj.opts;
            deps = obj.deps;
            cb = obj.cb;

            if (utils.isArrowFunction(cb)) { //TODO: send this error to runner?
                var msg = 'You cannot use an arrow function with describe callbacks; however, you may use arrow functions everywhere else.\n' +
                    'The reason is because every describe call creates a new nested test instance, and "this" is bound to that instance. \nFor every describe call, you ' +
                    'need a regular function as a callback. The remainder of your tests can be arrow function galore. \nIf you dont understand this, read up on how arrow functions bind "this" ' +
                    'to lexical scope, and why they cant just be used everywhere.\n\n'
                if (process.send) {
                    process.send({
                        errors: [],
                        msg: msg,
                        type: 'FATAL',
                        fatal: false
                    });
                }
                console.error(' => Suman error => ' + new Error(msg).stack);
                return;
            }

            if (suman.grepSuite && !(String(desc).search(suman.grepSuite) > -1)) {
                console.log(' => Suman warning => --grep-suite option was passed with value: ' + suman.grepSuite + 'and this didnt match the suite description with value:' + desc);
                if (process.send) {
                    process.send({
                        msg: ' --grep-suite command line option didnt match test suite description:' +
                        ' --grep-suite=' + suman.grepSuite + ' description=' + desc,
                        type: 'FATAL_SOFT',
                        fatal: false
                    });
                }
                process.exit(0);
            } else {

                suman.deps = deps;
                const parsedFn = parseFunction(cb);
                const args = parsedFn.args;

                if (suman.deps.length > args.length) {
                    var warning = 'You have more dependencies listed in the dep array than those injected into the callback';
                    if (process.send) {
                        process.send({
                            errors: [],
                            msg: warning,
                            type: 'WARNING',
                            fatal: false
                        });
                    } else {
                        console.log('Suman warning: ' + warning);
                    }
                }


                var lngth = Number(suman.deps.length); //copy value

                for (var i = lngth; i < args.length; i++) {
                    suman.deps.push(String(args[i]));
                }

                var indexOfDelay = suman.deps.indexOf('delay');


                var suite = new TestSuite({
                    desc: desc,
                    isTopLevel: true,
                    parallel: opts.parallel
                });

                ts.bindExtras(suite, null);
                allTests.push(suite);

                if (deps.length > 0) {
                    const d = domain.create();
                    d._suman_start = true;
                    d.on('error', function (err) {
                        d.exit();
                        process.nextTick(function () {
                            if (typeof process.send === 'function') {
                                console.error('_suman_start:', err.stack);
                                process.send({
                                    error: msg,
                                    msg: msg,
                                    type: 'FATAL',
                                    fatal: true
                                });
                            } else {
                                console.error(' => Suman error => ' + err.stack);
                            }
                            gracefulExit([err]);
                        });
                    });
                    d.run(function () {
                        assert(suman.config.ioc, 'No IoC path');
                        var ioc;
                        try {
                            ioc = require(path.resolve(process.cwd() + '/' + suman.config.ioc));
                        } catch (err) {
                            try {
                                ioc = require(path.resolve(utils.findProjectRoot(process.cwd()) + '/' + suman.config.ioc));
                            } catch (err) {
                                console.error(' => Suman tip => Create your own suman.ioc.js file instead of using the default file.');
                                ioc = require(path.resolve(__dirname + '/../suman.default.ioc.js'));
                            }
                        }

                        ioc(suman); //TODO: need to add domain to this?

                        suman.acquire(function (err, deps) {
                            if (err) {
                                throw err;
                            }
                            else {

                                //assert(Array.isArray(deps), 'deps from IoC is not an array.');

                                const $deps = [];

                                Object.keys(deps).forEach(function (key, index) {  //iterate over original array

                                    const dep = deps[key];

                                    if (dep) {
                                        $deps.push(dep);
                                    }
                                    else if (_.contains(constants.CORE_MODULE_LIST, key)) {
                                        $deps.push(require(key))
                                    }
                                    else if (_.contains(constants.SUMAN_HARD_LIST, key)) {
                                        switch (key) {
                                            case 'suite':
                                                $deps.push(suite);
                                        }

                                    }
                                    else {
                                        throw new Error('Dependency not met:' + key);
                                    }


                                });

                                startWholeShebang($deps);
                            }
                        });
                    });

                } else {
                    startWholeShebang([]);
                }

                //TODO: http://stackoverflow.com/questions/27192917/using-a-domain-to-test-for-an-error-thrown-deep-in-the-call-stack-in-node

                function startWholeShebang(deps) {


                    try {

                        var d = domain.create();
                        d._suman_start_whole_shebang = true;

                        d.on('error', function (err) {

                            console.error('startWholeShebang:', err.stack);
                            d.exit();

                            if (typeof process.send === 'function') {
                                process.send({
                                    msg: 'fatal error',
                                    error: err.stack,
                                    type: 'FATAL'
                                })
                            }
                            else {
                                console.error(' => Suman error => ', err.stack);
                            }
                        });


                        debug_core('suite is about to be applied: ' + suite.desc);

                        if (indexOfDelay >= 0) {

                            suite.isDelayed = true;

                            deps.splice(indexOfDelay, 0, function delay(err) {

                                process.nextTick(function () { //need to make sure delay is called asynchronously, but this should take care of it
                                    suite.isSetupComplete = true;
                                    suite.invokeChildren(start); //pass start function all the way through program until last child delay call is invoked!
                                });

                            });

                            if (!utils.checkForValInStr(cb.toString(), /delay/g)) { //TODO this will not work when delay is simply commented out
                                throw new Error('delay function injected into test suite, but the delay function was never referenced, so your test suite would never be invoked.');
                            }

                            cb.apply(suite, deps);

                        }
                        else {
                            cb.apply(suite, deps);
                            suite.isSetupComplete = true;
                            suite.invokeChildren(start); //pass start function all the way through program until last child delay call is invoked!
                        }


                    } catch (err) {

                        console.error(err.stack);
                        gracefulExit([err]);

                    } finally {
                        //TODO this is probably wrong
                        suman.logData(suite); //note: this is imperative for getting testId=0 to be logged at all
                    }

                    if (!process.send) {
                        debug_core('attempting to run X number of tests...');
                    }
                }

                var to;

                // to = setTimeout(function() { //TODO this timer should be unnecessary
                //   process.exit(5);
                // }, 5000000);

                function start() {

                    var count = 0;
                    var num = allTests.length;

                    ee.on('test_complete', function handleCompleteTest() {
                        count++;
                        debug_core("COUNT:", count, '(allTests.length):', allTests.length);
                        if (count >= num) {
                            try {
                                clearTimeout(to);
                            } catch (err) {

                            }
                            //TODO: log # of tests passed vs # of tests failed
                            suman.makeExit(); //note: this should just be invoked on('exit'), but we may need to force an exit if user puts in timers
                        }
                    });

                    async.eachSeries(allTests, function (test, cb) {

                        process.nextTick(function () { //this process.nextTick is prob unnecessary LOL
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
                                } else {
                                    cb(null);
                                }
                            });
                        });
                    } else {
                        cb(null);
                    }
                } else {
                    throw new Error('this should not happen...');
                }
            }

            function handleBeforeOrAfterEach(test, aBeforeOrAfterEach, cb) {

                debug_suman_test(aBeforeOrAfterEach.type + (aBeforeOrAfterEach.desc ? ':' + aBeforeOrAfterEach.desc : '') + ' - test desc: ' + test.desc);

                //TODO: if an error happens in beforeEach/afterEach we should fail immediately

                var d; //a new domain

                function makeCallback(err) {

                    try {
                        if (err) {
                            err.sumanFatal = true; //fatal because it's in a before/after each
                        }
                        clearTimeout(timer);
                        d.exit(); //note: domain d is most likely undefined at this point, not sure why
                    } catch (err) {
                        //process.stderr.write(String(err));
                    } finally {
                        cb(null, err);
                    }
                }

                function handlePotentialPromise(val, warn) {

                    if ((!val || (typeof val.then !== 'function')) && warn) { //TODO: check for type == 'Promise' not just null or not
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
                    done(aBeforeOrAfterEach.timeOutError);
                }, timeout);

                d = domain.create();
                d._suman = true;

                d.on('error', function (err) {
                    this.exit();
                    process.nextTick(function () {
                        done(err);
                    });
                });

                d.run(function () {

                    try {

                        var warn, isAsync = false;
                        var str = aBeforeOrAfterEach.toString();
                        if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) { //check for async function marker
                            warn = true;
                        }
                        if (str.indexOf('async') === 0) {
                            isAsync = true;
                        }

                        var args = parseFunction(aBeforeOrAfterEach).args;

                        var index;
                        if ((index = args.indexOf('t')) > -1) {
                            args.splice(index, 1, {
                                log: self.log,
                                data: test.data,
                                desc: String(test.desc),
                                testId: test.testId
                            });
                        } else if ((index = args.indexOf('_x')) > -1) { //for Babel async/await support
                            args.splice(index, 1, {
                                log: self.log,
                                data: test.data,
                                desc: String(test.desc),
                                testId: test.testId
                            });
                        }

                        if (!isAsync && (index = args.indexOf('done')) > -1) {

                            args.splice(index, 1, function (err) {
                                done(err);
                            });
                            if (!utils.checkForValInStr(aBeforeOrAfterEach.toString(), /done/g)) {
                                throw aBeforeOrAfterEach.NO_DONE;
                            }
                            aBeforeOrAfterEach.apply(self, args)
                        } else {
                            handlePotentialPromise(aBeforeOrAfterEach.apply(self, args), warn);
                        }

                    } catch (err) {
                        done(err);
                    }
                });

            }


            function handleTest(test, cb) {

                var d;

                function makeCallback(err) {
                    try {
                        clearTimeout(timer);
                        d.exit(); //domain is most likely undefined at this point, not sure why
                    } catch (err) {
                        //process.stderr.write(err);
                    } finally {
                        cb(null, err);
                    }

                }

                function handlePotentialPromise(val, warn) {

                    if ((!val || (typeof val.then !== 'function')) && warn) {
                        process.stdout.write('\nSuman warning: you may have forgotten to return a Promise from this test.\n');
                    }

                    Promise.resolve(val).then(function () {
                        done(null);
                    }).catch(function (err) {
                        done(err);
                    });
                }

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : test.timeout;

                console.log('timeout:', timeout);

                var timer = setTimeout(function () {

                    test.timedOut = true;
                    done(test.cb.timeOutError);
                }, timeout);

                d = domain.create();
                d._suman_test = true;

                d.on('error', function (err) {

                    console.error('???:', err.stack);
                    this.exit(); //extra handle for exiting domain
                    process.nextTick(function () {
                        if (err.sumanFatal) {
                            gracefulExit([err]);
                        } else {
                            done(err);
                        }
                    });

                });

                d.run(function () {

                    var warn = false;
                    var str = test.cb.toString();
                    if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {
                        warn = true;
                    }

                    var args = parseFunction(test.cb).args;

                    var index;
                    if ((index = args.indexOf('t')) > -1) {
                        args.splice(index, 1, {
                            log: self.log,
                            data: test.data,
                            desc: String(test.desc),
                            testId: test.testId
                        });
                    }

                    if ((index = args.indexOf('done')) > -1) {
                        args.splice(index, 1, function (err) {
                            done(err);
                        });
                        if (!utils.checkForValInStr(test.cb.toString(), /done/g)) {
                            throw test.cb.NO_DONE;
                        }
                        test.cb.apply(self, args)
                    } else {
                        handlePotentialPromise(test.cb.apply(self, args), warn);
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

                        gracefulExit(results, function () {
                            if (parallel) {
                                delaySum += (test.delay || 0);
                            } else {
                                delaySum = 0;
                            }

                            async.series([function (cb) {
                                var d = domain.create();
                                d._suman_series = true;
                                d.on('error', function (err) {
                                    console.error(err.stack);
                                });

                                // setTimeout(function() { //if test.delay is defined, we use setTimeout
                                d.run(function () {
                                    handleTest(test, function (err, result) {
                                        handleTestResult(result, test);
                                        cb(null, result);
                                    });
                                });
                                // }, delaySum || 0);
                                // debug_core('delaySum:', delaySum);

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

                var d; //d

                function makeCallback(err) {
                    try {
                        if (err) {
                            err.sumanFatal = true; //fatal because it's in a before/after each
                        }
                        clearTimeout(timer);
                        d.exit(); //domain is undefined at this point, not sure why
                    } catch (err) {
                        //process.stderr.write(String(err));
                    } finally {
                        cb(null, err);
                    }
                }

                function handlePotentialPromise(val, warn) {

                    if ((!val || (typeof val.then !== 'function')) && warn) {
                        process.stdout.write('\nSuman warning: you may have forgotten to return a Promise from this test.\n');
                    }

                    Promise.resolve(val).then(function () {
                        done(null);
                    }).catch(function (err) {
                        done(err);
                    });
                }

                /////////////////////////////////////////////////////////////////
                debugger;
                ////////////////////////////////////////////////////////////////

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    done(aBeforeOrAfter.timeOutError);
                }, timeout);

                /////////////////////////////////////////////////////////////////
                debugger;
                ////////////////////////////////////////////////////////////////

                d = domain.create();
                d._suman_before_after = true;

                d.on('error', function (err) {
                    this.exit();
                    process.nextTick(function () {
                        done(err);
                    });
                });

                d.run(function () {

                    var warn = false;
                    var str = aBeforeOrAfter.toString();
                    if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {
                        warn = true;
                    }

                    try {

                        var args = parseFunction(aBeforeOrAfter).args;
                        var index;

                        if ((index = args.indexOf('done')) > -1) {
                            args.splice(index, 1, function (err) {
                                done(err);
                            });
                            if (!utils.checkForValInStr(aBeforeOrAfter.toString(), /done/g)) {
                                throw aBeforeOrAfter.NO_DONE;
                            }
                            aBeforeOrAfter.apply(self, args)
                        } else {
                            handlePotentialPromise(aBeforeOrAfter.apply(self, args), warn);
                        }
                    } catch (err) {
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

                    fn1([function runPotentiallySerialTests(cb) { //TODO why are they merely "potentially" serial, aren't they always serial?
                            fn2(self.tests, function (test, cb) {
                                runTheTrap(test, {
                                    parallel: false
                                }, cb);
                            }, function complete(err, results) {
                                cb(null, results);
                            });

                        }, function runParallelTests(cb) {
                            var flattened = _.flatten([self.testsParallel, self.loopTests], true).concat([{
                                tests: self.parallelTests
                            }]);
                            fn2(flattened, function ($set, cb) { //run all parallel sets in series
                                async.each($set.tests, function (test, cb) { //but individual sets of parallel tests can run in parallel
                                    runTheTrap(test, {
                                        parallel: true
                                    }, cb);
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
                    } else {
                        cb(null);
                    }
                }

            ], function allDone(err, results) {
                if (self.children.length < 1 && self.parent) {
                    notifyParentThatChildIsComplete(self.parent.testId, self.testId, function () {
                        ee.emit('test_complete');
                        finished();
                    });
                } else {
                    ee.emit('test_complete');
                    finished();
                }
            });

        }


        return makeSuite;
    }
};
