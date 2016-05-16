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

        this.opts = obj.opts;
        this.testId = incr();
        this.isSetupComplete = false;
        this.parallel = !!(obj.opts.parallel === true || obj.opts.mode === 'parallel');
        this.skipped = this.opts.skip || false;
        this.only = this.opts.only || false;

        this.timeout = function(){

        };

        this.slow = function(){

        };

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

            this.desc = this.title = obj.desc; //TODO: can grab name from function

            before = function (desc, opts, before) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                if (!obj.opts.skip) {
                    this.getBefores().push({  //TODO: add timeout option
                        ctx: this,
                        desc: obj.desc || obj.fn.name,
                        timeout: obj.opts.timeout || 11000,
                        cb: obj.opts.cb || false,
                        fatal: !(obj.opts.fatal === false),
                        fn: obj.fn,
                        timeOutError: new Error('*timed out* - did you forget to call done/ctn/fatal()?'),
                        type: 'before/setup',
                        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
                    });
                }

                return this;
            };

            _interface === 'TDD' ? this.setup = before : this.before = before;

            after = function (desc, opts, after) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                if (!obj.opts.skip) {
                    this.getAfters().push({   //TODO: add timeout option
                        ctx: this,
                        timeout: obj.opts.timeout || 11000,
                        desc: obj.desc || obj.fn.name,
                        cb: obj.opts.cb || false,
                        fatal: !(obj.opts.fatal === false),
                        fn: obj.fn,
                        type: 'after/teardown',
                        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
                    });
                }

                return this;
            };

            _interface === 'TDD' ? this.teardown = after : this.after = after;

            beforeEach = function (desc, opts, aBeforeEach) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                if (!obj.opts.skip) {
                    this.getBeforeEaches().push({  //TODO: add timeout option
                        ctx: this,
                        timeout: obj.opts.timeout || 11000,
                        desc: obj.desc || obj.fn.name,
                        fn: obj.fn,
                        fatal: !(obj.opts.fatal === false),
                        cb: obj.opts.cb || false,
                        type: 'beforeEach/setupTest',
                        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
                    });
                }

                return this;
            };

            _interface === 'TDD' ? this.setupTest = beforeEach : this.beforeEach = beforeEach;

            afterEach = function (desc, opts, aAfterEach) {
                handleSetupComplete(this);
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                if (!obj.opts.skip) {
                    this.getAfterEaches().push({ //TODO: add timeout option
                        ctx: this,
                        timeout: obj.opts.timeout || 11000,
                        desc: obj.desc || obj.fn.name,
                        cb: obj.opts.cb || false,
                        fatal: !(obj.opts.fatal === false),
                        fn: obj.fn,
                        type: 'afterEach/teardownTest',
                        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
                    });
                }
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
                    testData = {testId: incr(), desc: desc, skipped: true, skippedDueToItOnly: true};
                    this.getTests().push(testData);
                    return this;
                }

                var stubbed = false;

                if (!fn) {
                    stubbed = true;
                }

                if(opts.plan && typeof opts.plan !== 'number'){
                    console.error('"plan" option is not an integer.');
                    return process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_A_NUMBER);
                }
                
                if (opts.hasOwnProperty('parallel')) {
                    if (opts.hasOwnProperty('mode')) {
                        console.log(' => Suman warning => Used both parallel and mode options => mode will take precedence.');
                        if (opts.mode !== 'parallel' && opts.mode !== 'series') {
                            console.log(' => Suman warning => valid "môde" options are only values of "parallel" or "series".');
                        }
                    }
                }

                //TODO: need to fix, because user could overwrite API data
                testData = {
                    testId: incr(),
                    stubbed: stubbed,
                    data: {},
                    plan: typeof opts.plan === 'number' ? opts.plan : null,
                    originalOpts: opts,
                    only: opts.only,
                    skip: opts.skip,
                    value: opts.value,
                    throws: opts.throws,
                    parallel: (opts.parallel === true || opts.mode === 'parallel'),
                    mode: opts.mode,
                    delay: opts.delay,
                    cb: opts.cb,
                    type: 'it-standard',
                    timeout: opts.timeout || 20000,
                    desc: desc,
                    fn: fn,
                    warningErr: new Error('SUMAN_TEMP_WARNING_ERROR'),
                    timedOut: false,
                    complete: false,
                    error: null
                };

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
                const obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                desc = obj.desc;
                opts = obj.opts;
                cb = obj.cb;

                if (utils.isArrowFunction(cb) || utils.isGeneratorFn()) { //TODO: need to check for generators or async/await as well
                    const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
                    console.log('\n\n' + msg + '\n\n');
                    console.error(new Error(' => Suman error => invalid arrow/generator function usage.').stack);
                    return process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
                }

                if (this.parallel && opts.parallel === false) {
                    process.stdout.write('\n => Suman warning => parent describe ("' + this.desc + '") is parallel, so child describe ("' + desc + '") will be run in parallel with other sibling suites.');
                    process.stdout.write('\n => Suman warning => To see more info on this, visit: oresoftware.github.io/suman\n\n');
                }

                const parent = this;
                const suite = TestSuiteMaker.new({
                    desc: desc,
                    title: desc,
                    opts: opts
                });

                suite.skipped = opts.skip || this.skipped;
                suite.parent = _.pick(this, 'testId', 'desc', 'title', 'parallel');
                this.getChildren().push({testId: suite.testId});
                allDescribeBlocks.push(suite);

                suite.__proto__._run = function run(callback) {

                    const d = domain.create();

                    d.once('error', function (err) {
                        console.log(err.stack);
                        err.sumanExitCode = constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
                        gracefulExit([err]);
                    });

                    d.run(function () {

                        //note: *very important* => each describe block needs to be invoked in series, one by one,
                        // so that we bind skip and only to the right suite

                        suite.__bindExtras(suite);
                        if (cb.length < 1) {
                            //TODO: do we want this to be async (process.nextTick?)
                            cb.apply(suite, []);
                            d.exit();
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
                                console.log(new Error('delay function injected into test suite, but the delay function was never referenced, so your test suite would never be invoked.').stack);
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
                                        console.log(err.stack);
                                        err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                                        gracefulExit(err);
                                    }
                                    else {
                                        d.exit();
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


        //Note: we hide most properties in the prototype
        TestSuite.prototype = Object.create(new TestSuiteBase(data));


        function helper(f, desc, opts, fn) {
            const obj = handleExtraOpts.handleExtraTestCaseOpts(desc, opts, fn);
            f.bind(ctx)(obj.desc, obj.opts, obj.fn)
        }

        TestSuite.prototype.__bindExtras = function bindExtras(ctx) {

            describe.skip = function (desc, opts, cb) {
                const obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            describe.only = function (desc, opts, cb) {
                suman.describeOnlyIsTriggered = true;
                const obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            it.skip = function (desc, opts, fn) {
                const obj = handleExtraOpts.handleExtraTestCaseOpts(desc, opts, fn);
                obj.opts.skip = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            it.only = function (desc, opts, fn) {
                suman.itOnlyIsTriggered = true;
                const obj = handleExtraOpts.handleExtraTestCaseOpts.apply(null, arguments);
                obj.opts.only = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            it.only.cb = function () {
                suman.itOnlyIsTriggered = true;
                const obj = handleExtraOpts.handleExtraTestCaseOpts.apply(null, arguments);
                obj.opts.only = true;
                obj.opts.cb = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            it.skip.cb = function () {
                const obj = handleExtraOpts.handleExtraTestCaseOpts.apply(null, arguments);
                obj.opts.skip = true;
                obj.opts.cb = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            it.cb = function (desc, opts, fn) {
                const obj = handleExtraOpts.handleExtraTestCaseOpts.apply(null, arguments);
                obj.opts.cb = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.fn);
            };

            it.cb.skip = it.skip.cb;
            it.cb.only = it.only.cb;

            before.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return before.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            before.skip = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.skip = true;
                return before.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            before.skip.cb = before.cb.skip = before.skip;

            after.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return after.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            after.skip = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.skip = true;
                return after.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            after.skip.cb = after.cb.skip = after.skip;

            beforeEach.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return beforeEach.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            beforeEach.skip = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.skip = true;
                return beforeEach.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            beforeEach.skip.cb = beforeEach.cb.skip = beforeEach.skip;

            afterEach.cb = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.cb = true;
                return afterEach.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            afterEach.skip = function () {
                const obj = handleExtraOpts.handleExtraOpts.apply(null, arguments);
                obj.opts.skip = true;
                return afterEach.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            afterEach.skip.cb = afterEach.cb.skip = afterEach.skip;

        };

        TestSuite.prototype.__invokeChildren = function (start) {

            const testIds = _.pluck(this.getChildren(), 'testId');

            const children = allDescribeBlocks.filter(function (test) {
                return _.contains(testIds, test.testId);
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
                const e = new Error('You cannot call the following functions asynchronously - describe(), it(), before(), beforeEach(), after(), afterEach()\n\t- do not ' +
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
                cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
            }
            return this;
        };


        TestSuite.prototype.__startSuite = function startSuite(finished) {

            const self = this;

            //TODO: do we need to notify parent that child is complete if child is skipped?
            //TODO: incongruent behavior with ONLY, in same cases we eliminate describes before they are registered
            //TODO: and in other cases they get registered but rejected after they start
            //TODO: furthemore if a child describe is only, but the parent is not, then we still need to run hooks for parent

            if (suman.describeOnlyIsTriggered && !this.only) {
                this.skippedDueToOnly = this.skipped = true;
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

                    //TODO: need to look ahead to see if children are skipped too? Might be hard
                    if (self.getChildren().length < 1 && self.skipped) {
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
                                if (self.skipped) {
                                    test.skippedDueToParentSkipped = test.skipped = true;
                                }
                                if (self.skippedDueToOnly) {
                                    test.skippedDueToParentOnly = test.skipped = true;
                                }
                                if (itOnlyIsTriggered && !test.only) {
                                    test.skippedDueToItOnly = test.skipped = true;
                                }
                                runTheTrap(self, test, {
                                    parallel: false
                                }, cb);
                            }, function complete(err, results) {
                                cb(null, results);
                            });

                        }, function runParallelTests(cb) {

                            const flattened = [{tests: self.getParallelTests()}];

                            fn2(flattened, function ($set, cb) { //run all parallel sets in series
                                async.each($set.tests, function (test, cb) { //but individual sets of parallel tests can run in parallel
                                    if (self.skipped) {
                                        test.skippedDueToParentSkipped = test.skipped = true;
                                    }
                                    if (self.skippedDueToOnly) {
                                        test.skippedDueToParentOnly = test.skipped = true;
                                    }
                                    if (itOnlyIsTriggered && !test.only) {
                                        test.skippedDueToItOnly = test.skipped = true;
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
