/**
 * Created by denman on 12/28/15.
 */


//TODO: create immutable props - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

//#core
const domain = require('domain');
const _ = require('underscore');
const async = require('async');

//#npm
const fnArgs = require('function-arguments');
const debugCore = require('debug')('suman:core');

//#project
const constants = require('../config/suman-constants');
const incr = require('./incrementer');
const makeHandleExtraOpts = require('./handle-extra-opts');
const SumanErrors = require('../config/suman-errors');
const utils = require('./utils');
const makeTheTrap = require('./test-suite-helpers/make-the-trap');
const makeHandleBeforesAndAfters = require('./test-suite-helpers/make-handle-befores-afters');

///////////////////////////////////////////////////////////////////////

function makeTestSuite(suman, gracefulExit, testErrors, ee) {

    const allDescribeBlocks = suman.allDescribeBlocks;
    const handleExtraOpts = makeHandleExtraOpts(suman);
    const runTheTrap = makeTheTrap(suman, gracefulExit, testErrors);
    const handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);

    const _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';

    function TestSuiteBase(obj) {

        this.testId = incr();
        this.isSetupComplete = false;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
        this.parallel = obj.parallel || false;
        this.skipped = obj.skip || false;
        this.only = obj.only || false;
        this.opts = obj.opts;

        const children = [];
        const tests = [];
        const parallelTests = [];
        const testsParallel = [];
        const loopTests = [];
        const befores = [];
        const beforeEaches = [];
        const afters = [];
        const afterEaches = [];

        this.getChildren = function () {
            return children;
        };

        this.getTests = function () {
            return tests;
        };

        this.getParallelTests = function () {
            return parallelTests;
        };

        this.getTestsParallel = function () {
            return testsParallel;
        };

        this.getLoopTests = function () {
            return loopTests;
        };

        this.getBefores = function () {
            return befores;
        };

        this.getBeforeEaches = function () {
            return beforeEaches;
        };

        this.getAfters = function () {
            return afters;
        };

        this.getAfterEaches = function () {
            return afterEaches;
        };
    }

    const TestSuiteMaker = {};

    TestSuiteMaker.new = function (data) {  //TODO: need to validate raw data...

        var it, describe, before, after, beforeEach, afterEach;

        function TestSuite(obj) {

            this.desc = obj.desc;
            this.title = obj.desc;
            this.opts = obj.opts;

            before = function (desc, opts, before) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                //TODO: add timeout option
                this.getBefores().push({
                    ctx: this,
                    desc: obj.desc || obj.fn.name,
                    cb: obj.opts.cb || false,
                    fn: obj.fn,
                    timeOutError: new Error('*timed out* - did you forget to call done/ctn/fatal()?'),
                    type: 'before/setup',
                    NO_DONE: new Error('No done referenced in callback')
                });
                return this;
            };

            _interface === 'TDD' ? this.setup = before : this.before = before;

            after = function (desc, opts, after) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                //TODO: add timeout option
                this.getAfters().push({
                    ctx: this,
                    desc: obj.desc || obj.fn.name,
                    cb: obj.opts.cb || false,
                    fn: obj.fn,
                    timeOutError: new Error('*timed out* - did you forget to call done/ctn/fatal()?'),
                    type: 'after/teardown',
                    NO_DONE: new Error('No done referenced in callback')
                });
                return this;
            };

            _interface === 'TDD' ? this.teardown = after : this.after = after;

            beforeEach = function (desc, opts, aBeforeEach) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                //TODO: add timeout option
                this.getBeforeEaches().push({
                    ctx: this,
                    desc: obj.desc || obj.fn.name,
                    fn: obj.fn,
                    cb: obj.opts.cb || false,
                    timeOutError: new Error('*timed out* - did you forget to call done()?'),
                    type: 'beforeEach/setupTest',
                    NO_DONE: new Error('No done referenced in callback')
                });
                return this;
            };

            _interface === 'TDD' ? this.setupTest = beforeEach : this.beforeEach = beforeEach;

            afterEach = function (desc, opts, aAfterEach) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                //TODO: add timeout option
                this.getAfterEaches().push({
                    ctx: this,
                    desc: obj.desc || obj.fn.name,
                    cb: obj.opts.cb || false,
                    fn: obj.fn,
                    timeOutError: new Error('*timed out* - did you forget to call done()?'),
                    type: 'afterEach/teardownTest',
                    NO_DONE: new Error('No done referenced in callback')
                });
                return this;
            };

            _interface === 'TDD' ? this.teardownTest = afterEach : this.afterEach = afterEach;

            it = function (desc, opts, fn) {

                handleSetupComplete(this);

                var obj = handleExtraOpts.handleExtraTestCaseOpts(desc, opts, fn);

                desc = obj.desc;
                opts = obj.opts;
                fn = obj.fn;

                var testData = null;

                if (opts.skip) {
                    testData = {testId: incr(), desc: desc, skipped: true};
                    this.getTests().push(testData);
                    return this;
                }

                if (suman.itOnlyIsTriggered && !opts.only) {
                    //TODO: fix this
                    testData = {testId: incr(), desc: desc, skippedDueToOnly: true};
                    this.getTests().push(testData);
                    return this;
                }

                var stubbed = false;

                if (!fn) {
                    stubbed = true;
                }
                else {
                    fn.NO_DONE = new Error('No done referenced in callback');
                    fn.timeOutError = new Error('*timed out* - did you forget to call done()?');
                }

                //TODO: need to fix, because user could overwrite API data
                testData = {
                    testId: incr(),
                    stubbed: stubbed,
                    data: {},
                    plan: typeof opts.plan === 'number' ? opts.plan : null,
                    only: opts.only,
                    skip: opts.skip,
                    value: opts.value,
                    throws: opts.throws,
                    parallel: opts.parallel,
                    mode: opts.mode,
                    delay: opts.delay,
                    cb: opts.cb,
                    type: 'it-standard',
                    timeout: opts.timeout || 5000,
                    desc: desc,
                    fn: fn,
                    timedOut: false,
                    complete: false,
                    error: null
                };

                if (opts.hasOwnProperty('parallel')) {
                    if (opts.hasOwnProperty('mode')) {
                        console.log(' => Suman warning => Used both parallel and mode options => mode will take precedence.');
                        if (opts.mode !== 'parallel' && opts.mode !== 'series') {
                            console.log(' => Suman warning => valid "môde" options are only values of "parallel" or "series".');
                        }
                    }
                }

                if (opts.mode === 'parallel') {
                    opts.parallel = true;
                }

                if (opts.parallel || (this.parallel && opts.parallel !== false)) {
                    this.getParallelTests().push(testData);
                }
                else {
                    this.getTests().push(testData);
                }

                return this;
            };

            _interface === 'TDD' ? this.test = it : this.it = it;


            describe = this.context = function (desc, opts, cb) {

                handleSetupComplete(this);
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);

                desc = obj.desc;
                opts = obj.opts;
                cb = obj.cb;

                if (utils.isArrowFunction(cb) || utils.isGeneratorFn()) { //TODO: need to check for generators or async/await as well
                    console.error(' => Suman error => invalid arrow/generator function usage.');
                    process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
                    return;
                }


                if (this.parallel && opts.parallel === false) {
                    process.stdout.write('\n => Suman warning => parent describe ("' + this.desc + '") is parallel, so child describe ("' + desc + '") will be run in parallel with other sibling suites.');
                    process.stdout.write('\n => Suman warning => To see more info on this, visit: oresoftware.github.io/suman\n\n');
                }

                const suite = TestSuiteMaker.new({
                    desc: desc,
                    title: desc,
                    isDescribe: true,
                    opts: opts
                });

                suite.skipped = opts.skip || this.skipped;
                suite.parent = _.pick(this, 'testId', 'desc', 'title', 'parallel');
                this.getChildren().push({testId: suite.testId});
                allDescribeBlocks.push(suite);


                const parent = this;
                suite.__proto__._run = function run(callback) {

                    const d = domain.create();

                    d.once('error', function (err) {
                        d.exit();
                        console.error(err.stack);
                        process.nextTick(function () {
                            suman.logFatalSuite(suite);
                            gracefulExit([err]);
                        });
                    });

                    d.run(function () {

                        //note: this needs to be called synchronously, so that we bind skip and only to the right suite

                        suite.__bindExtras(suite);
                        if (cb.length < 1) {
                            //TODO: do we want this to be async (process.nextTick?)
                            cb.apply(suite, []);
                            process.nextTick(function () {
                                suite.__proto__.isSetupComplete = true;
                                suite.__bindExtras(parent);  //bind extras back to parent test
                                suite.__invokeChildren(callback);
                            });
                        }
                        else {
                            //TODO: right now this.describes are only geared up for one injected param, "delay"; need to generify.
                            suite.__proto__.isDelayed = true;

                            if (!utils.checkForValInStr(cb.toString(), /delay/g)) { //TODO this will not work when delay is simply commented out
                                console.error(new Error('delay function injected into test suite, but the delay function was never referenced, so your test suite would never be invoked.').stack);
                                setImmediate(function () {
                                    process.exit(constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                                });
                            }
                            else {

                                const to = setTimeout(function () {
                                    console.error(' => Suman fatal error => delay function was not called within alloted time.');
                                    process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                                }, 7000);

                                cb.apply(suite, [function delay(err) {
                                    clearTimeout(to);
                                    if (err) {
                                        err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                                        gracefulExit(err);
                                    }
                                    else {
                                        process.nextTick(function () {  //need to make sure delay is called asynchronously, but this should take care of it
                                            suite.__proto__.isSetupComplete = true;
                                            suite.__bindExtras(parent);  //bind extras back to parent test
                                            suite.__invokeChildren(callback); // pass callback
                                        });
                                    }
                                }]);
                            }
                        }
                    });
                };
            };

            _interface === 'TDD' ? this.suite = describe : this.describe = describe;
        }


        TestSuite.prototype = Object.create(new TestSuiteBase(data));

        TestSuite.prototype.__bindExtras = function bindExtras(ctx) {

            describe.skip = describe.SKIP = function (desc, opts, cb) {
                const obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            describe.only = describe.ONLY = function (desc, opts, cb) {
                suman.describeOnlyIsTriggered = true;
                const obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            it.skip = it.SKIP = function (desc, opts, fn) {
                const obj = handleExtraOpts.handleExtraTestCaseOpts(desc, opts, fn);
                obj.opts.skip = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            it.only = it.ONLY = function (desc, opts, fn) {
                suman.itOnlyIsTriggered = true;
                const obj = handleExtraOpts.handleExtraTestCaseOpts.apply(null, arguments);
                obj.opts.only = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            it.cb = function (desc, opts, fn) {
                const obj = handleExtraOpts.handleExtraTestCaseOpts.apply(null, arguments);
                obj.opts.cb = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            before.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return before.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            after.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return after.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            beforeEach.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return beforeEach.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            afterEach.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return afterEach.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

        };

        TestSuite.prototype.__invokeChildren = function (start) {

            var self = this;
            var testIds = _.pluck(this.getChildren(), 'testId');

            var children = allDescribeBlocks.filter(function (test) {
                return _.contains(testIds, test.testId)/* && !test.skipped*/;
            });

            async.eachSeries(children, function (child, cb) {

                child._run(function () {
                    cb(null);
                });

            }, function complete() {
                start();
            });

        };


        function handleSetupComplete(test) {
            if (test.isSetupComplete) {
                var e = new Error('You cannot call the following functions asynchronously - describe(), it(), before(), beforeEach(), after(), afterEach()\n\t- do not ' +
                    'put these calls inside a setTimeout, setImmediate, process.nextTick or any other asynchronous calls. ***This includes nesting these calls inside each other.***\n\t' +
                    'This is a fatal error because behavior will be completely indeterminate upon asynchronous registry of these calls.');
                e.sumanFatal = true;
                throw e;
            }
        }


        TestSuite.prototype.toString = function () {
            return this.constructor + ':' + this.desc;
        };


        // TestSuite.prototype.log = function (data) {
        //     suman.log(data, this);
        // };


        TestSuite.prototype.series = function (cb) {
            if (typeof cb === 'function') {
                const ret = cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
            }
            return this;
        };


        TestSuite.prototype.__startSuite = function startSuite(finished) {

            var self = this;


            //TODO: do we need to notify parent that child is complete if child is skipped?


            if (this.skipped) {
                // return finished();
            }

            //TODO: incongruent behavior with ONLY, in same cases we eliminate describes before they are registered
            //TODO: and in other cases they get registered but rejected after they start
            //TODO: furthemore if a child describe is only, but the parent is not, then we still need to run hooks for parent

            if (suman.describeOnlyIsTriggered && !this.only) {
                this.skippedDueToOnly = true;
                // return finished();
            }

            const itOnlyIsTriggered = suman.itOnlyIsTriggered;


            function notifyParentThatChildIsComplete(parentTestId, childTestId, cb) {

                var parent = null;

                for (var i = 0; i < allDescribeBlocks.length; i++) {
                    var temp = allDescribeBlocks[i];
                    if (temp.testId === parentTestId) {
                        parent = temp;
                        break;
                    }
                }

                if (!parent) { //note: root suite has no parent
                    throw new Error('No parent defined for child, should not happen.');
                }
                else {
                    var lastChild = parent.getChildren()[parent.getChildren().length - 1];
                    if (lastChild.testId === childTestId) {
                        async.mapSeries(parent.getAfters(), handleBeforesAndAfters(self), function complete(err, results) {
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
                }
            }


            async.series([
                function runBefores(cb) {

                    if (self.skipped || self.skippedDueToOnly) {
                        process.nextTick(cb);
                    }
                    else {
                        //TODO: can probably prevent befores from running by checking self.tests.length < 1
                        async.mapSeries(self.getBefores(), handleBeforesAndAfters(self), function complete(err, results) {
                            gracefulExit(results, function () {
                                cb(null);
                            });
                        });
                    }

                },
                function runTests(cb) {

                    var fn1 = self.parallel ? async.parallel : async.series;
                    var fn2 = self.parallel ? async.each : async.eachSeries;

                    fn1([function runPotentiallySerialTests(cb) {
                            fn2(self.getTests(), function (test, cb) {
                                if (self.skippedDueToOnly || self.skipped || (itOnlyIsTriggered && !test.only)) {
                                    test.skipped = true;
                                }
                                runTheTrap(self, test, {
                                    parallel: false
                                }, cb);
                            }, function complete(err, results) {
                                cb(null, results);
                            });

                        }, function runParallelTests(cb) {

                            // var flattened = _.flatten([self.getTestsParallel(), self.getLoopTests()], true).concat([{
                            //     tests: self.getParallelTests()
                            // }]);

                            var flattened = [{tests: self.getParallelTests()}];

                            fn2(flattened, function ($set, cb) { //run all parallel sets in series
                                // console.log('$set:',$set);
                                async.each($set.tests, function (test, cb) { //but individual sets of parallel tests can run in parallel
                                    if (self.skippedDueToOnly || self.skipped) {
                                        test.skipped = true;
                                    }
                                    runTheTrap(self, test, {
                                        parallel: true
                                    }, cb);
                                }, function done(err, results) {
                                    cb(null, results);
                                });
                            }, function done(err, results) {
                                cb(null, results);
                            });
                        }],
                        function doneWithallDescribeBlocks(err, results) {
                            cb(null, results);
                        });

                },
                function runAfters(cb) {

                    if (self.getChildren().length < 1 && !self.skipped && !self.skippedDueToOnly) {
                        async.mapSeries(self.getAfters(), handleBeforesAndAfters(self), function complete(err, results) {
                            gracefulExit(results, function () {
                                cb(null);
                            });
                        });
                    } else {
                        process.nextTick(cb);
                    }
                }

            ], function allDone(err, results) {
                if (self.getChildren().length < 1 && self.parent) {
                    notifyParentThatChildIsComplete(self.parent.testId, self.testId, function () {
                        finished();
                    });
                } else {
                    finished();
                }
            });

        };

        return new TestSuite(data);

    };

    return {
        Maker: TestSuiteMaker
    };

}


module.exports = makeTestSuite;
