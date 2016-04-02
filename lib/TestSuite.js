/**
 * Created by denman on 12/28/15.
 */


//TODO: create immutable props - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

//#core
const domain = require('domain');
const _ = require('underscore');
const async = require('async');

//#npm
const parseFunction = require('parse-function');
const debugCore = require('debug')('suman:core');
const debugSumanTest = require('debug')('suman:test');

//#project
const incr = require('./incrementer');
const makeSuiteLite = require('./make-suite-lite');
const makeHandleExtraOpts = require('./handle-extra-opts');
const SumanErrors = require('../config/suman-errors');
const utils = require('./utils');
const makeTheTrap = require('./test-suite-helpers/make-the-trap');
const makeHandleBeforesAndAfters = require('./test-suite-helpers/make-handle-befores-afters');

///////////////////////////////////////////////////////////////////////

function makeTestSuite(suman, allTests, gracefulExit, testErrors, ee) {

    const handleExtraOpts = makeHandleExtraOpts(suman);
    const ParallelTestSet = require('./ParallelTestSet')(suman);
    const LoopTestSet = require('./LoopTestSet')(suman);
    const runTheTrap = makeTheTrap(suman, allTests, gracefulExit, testErrors);
    const handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);

    function TestSuiteBase(obj) {

        this.testId = incr();
        this.isSetupComplete = false;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
        this.parallel = obj.parallel || false;
        this.skip = obj.skip || false;
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

    const Maker = {};

    Maker.new = function (data) {  //TODO: need to validate raw data...

        var it, describe;

        function TestSuite(obj) {

            this.desc = obj.desc;
            this.opts = obj.opts;
            

            this.before = function (desc, before) {
                handleSetupComplete(this);
                var obj = handleOptionalDesc(desc, before);
                //TODO: add timeout option
                var fn = obj.fn;
                fn.type = 'before';
                fn.timeOutError = new Error('timed out - did you forget to call done()?');
                fn.NO_DONE = new Error('No done referenced in callback');
                this.getBefores().push(fn);
                return this;
            };

            this.after = function (desc, after) {
                handleSetupComplete(this);
                var obj = handleOptionalDesc(desc, after);
                var fn = obj.fn;
                //TODO: add timeout option
                fn.type = 'after';
                fn.timeOutError = new Error('timed out - did you forget to call done()?');
                fn.NO_DONE = new Error('No done referenced in callback');
                this.getAfters().push(fn);
                return this;
            };

            this.beforeEach = function (desc, aBeforeEach) {
                handleSetupComplete(this);
                var obj = handleOptionalDesc(desc, aBeforeEach);
                var fn = obj.fn;
                //TODO: add timeout option
                fn.type = 'beforeEach';
                fn.timeOutError = new Error('timed out - did you forget to call done()?');
                fn.NO_DONE = new Error('No done referenced in callback');
                this.getBeforeEaches().push(fn);
                return this;
            };

            this.afterEach = function (desc, aAfterEach) {
                handleSetupComplete(this);
                var obj = handleOptionalDesc(desc, aAfterEach);
                var fn = obj.fn;
                //TODO: add timeout option
                fn.type = 'afterEach';
                fn.timeOutError = new Error('timed out - did you forget to call done()?');
                fn.NO_DONE = new Error('No done referenced in callback');
                this.getAfterEaches().push(fn);
                return this;
            };


            it = this.it = this.test = function (desc, opts, cb) {

                handleSetupComplete(this);

                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);

                desc = obj.desc;
                opts = obj.opts;
                cb = obj.cb;

                if (opts.skip) {
                    return this;
                }

                if (suman.itOnlyIsTriggered && !opts.only) {
                    debugCore('describeOnlyIsTriggered && and this describe is not an only, so skipped:' + desc);
                    return this;
                }

                cb.NO_DONE = new Error('No done referenced in callback');

                var testData = _.extend({}, opts, {
                    testId: incr(),
                    data: {},
                    //opts: opts,
                    type: 'it-standard',
                    timeout: opts.timeout || 5000,
                    desc: desc,
                    cb: cb,
                    timedOut: false,
                    complete: false,
                    error: null
                });

                testData.cb.timeOutError = new Error('timed out - did you forget to call done()?');

                if (opts.parallel || this.parallel) {
                    this.getParallelTests().push(testData);
                }
                else {
                    this.getTests().push(testData);
                }

                return this;
            };


            describe = this.describe = this.context = function (desc, opts, cb) {

                //TestSuite.prototype = Object.create({
                //    children: [],
                //    tests: [],
                //    parallelTests: [],
                //    testsParallel: [],
                //    loopTests: [],
                //    befores: [],
                //    beforeEaches: [],
                //    afters: [],
                //    afterEaches: []
                //});


                handleSetupComplete(this);
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);

                desc = obj.desc;
                opts = obj.opts;
                cb = obj.cb;

                if (utils.isArrowFunction(cb)) {
                    throw new Error('You cannot use an arrow function with describe callbacks; however, you may use arrow functions everywhere else, except describes.')
                }

                if (opts.skip) {
                    debugCore('describe is skipped:' + desc);
                    return;
                }

                if (suman.describeOnlyIsTriggered && !opts.only) {
                    debugCore('describeOnlyIsTriggered && and this describe is not an only, so skipped:' + desc);
                    return;
                }

                if (this.parallel) {
                    if (opts.parallel === false) {
                        //TODO: we may want to switch this, so that the child can override this
                        process.stdout.write('\nwarning: parent describe ("' + this.desc + '") is parallel, so child describe ("' + desc + '") will be parallel also.\n\n');
                    }
                    opts.parallel = true;  //note: if parent is parallel, child is also parallel because we say so
                }

                var test = Maker.new(_.extend({}, opts, {
                    desc: desc,
                    isDescribe: true,
                    opts: opts
                }));

                test.parent = _.pick(this, 'testId');
                this.getChildren().push({testId: test.testId});
                allTests.push(test);

                debugCore('test is about to be applied: ' + test.desc);

                var parent = this;

                test.run = function run(callback) {  //TODO: put run on the proto

                    domain.create().on('error', function (err) {

                        console.error(err.stack);
                        suman.logFatalSuite(test);
                        gracefulExit([err]);

                    }).run(function () {

                        test.__bindExtras(test);

                        if (cb.length < 1) {
                            cb.apply(test, []);
                            test.__proto__.isSetupComplete = true;
                            test.__bindExtras(parent);  //bind extras back to parent test
                            test.__invokeChildren(callback);
                        }
                        else {
                            test.__proto__.isDelayed = true;
                            cb.apply(test, [function delay(err) {
                                process.nextTick(function () {  //need to make sure delay is called asynchronously, but this should take care of it
                                    test.__proto__.isSetupComplete = true;
                                    test.__bindExtras(parent);  //bind extras back to parent test
                                    test.__invokeChildren(callback); // pass callback
                                });
                            }]);
                        }


                    });
                };
            };
        }

        TestSuite.prototype = Object.create(new TestSuiteBase(data));


        TestSuite.prototype.__bindExtras = function bindExtras(ctx) {

            describe.skip = describe.SKIP = function (desc, opts, cb) {
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            describe.only = describe.ONLY = function (desc, opts, cb) {
                suman.describeOnlyIsTriggered = true;
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            it.skip = it.SKIP = function (desc, opts, cb) {
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

            it.only = it.ONLY = function (desc, opts, cb) {
                suman.itOnlyIsTriggered = true;
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.cb);
            };

        };

        TestSuite.prototype.__invokeChildren = function (start) {

            var self = this;
            var testIds = _.pluck(this.getChildren(), 'testId');

            var children = allTests.filter(function (test) {
                if (_.contains(testIds, test.testId)) {
                    return true;
                }
            });

            async.eachSeries(children, function (child, cb) {

                child.run(function () {
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

        function handleOptionalDesc(desc, fn) {
            var obj = {};
            if (typeof desc === 'function') {
                obj.fn = desc;
                obj.fn.desc = null;
            }
            else if (typeof desc === 'string') {
                if (typeof fn !== 'function') {
                    throw new Error('fn is not a function');
                }
                obj.fn = fn;
                obj.fn.desc = desc;
            }
            else {
                throw new Error('Bad arguments to before/after/beforeEach/afterEach');
            }

            return obj;
        }

        TestSuite.prototype.toString = function () {
            return this.constructor + ':' + this.desc;
        };


        TestSuite.prototype.log = function (data) {
            suman.log(data, this);
        };

        TestSuite.prototype.series = function (cb) {
            if (typeof cb === 'function') {
                cb.apply(this, []);
            }
            return this;
        };


        TestSuite.prototype.runParallel = function (cb) {
            var self = this;
            var parTest = new ParallelTestSet();
            this.getTestsParallel().push(parTest);
            cb.apply(parTest, []);
            return this;
        };


        TestSuite.prototype.loop = function (arr, cb) {
            var self = this;
            var loopTest = new LoopTestSet();

            arr.forEach(function (item, index) {
                cb.apply(loopTest, [item, index]);
            });

            //suman.logData(loopTest);
            this.getLoopTests().push(loopTest);
            return this;
        };

        //TestSuite.prototype.__startSuite = function (finished) {
        //    return __startSuite.bind(this)(finished);
        //};

        TestSuite.prototype.__startSuite = function startSuite(finished) {

            var self = this;

            if (this.skip) {
                throw new Error('skip in startSuite should not happen');
                return finished();
            }

            if (suman.describeOnlyIsTriggered && !this.only) {
                debugCore('startSuite: describeOnlyIsTriggered && and this describe is not an only, so skipped:' + this.desc);
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

                if (parent) { //note: root suite has no parent
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
                } else {
                    throw new Error('this should not happen...');
                }
            }


            //TODO Change to return suite and test for each callback

            async.series([
                function runBefores(cb) {
                    //TODO: can probably prevent befores from running by checking self.tests.length < 1
                    async.mapSeries(self.getBefores(), handleBeforesAndAfters(self), function complete(err, results) {
                        gracefulExit(results, function () {
                            if (self.parent && self.parent.parallel /*self.parallel*/) {
                                finished = _.once(finished);
                                process.nextTick(function () {
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
                            fn2(self.getTests(), function (test, cb) {
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
                        function doneWithAllTests(err, results) {
                            cb(null, results);
                        });

                },
                function runAfters(cb) {
                    if (self.getChildren().length < 1) {
                        async.mapSeries(self.getAfters(), handleBeforesAndAfters(self), function complete(err, results) {
                            gracefulExit(results, function () {
                                cb(null);
                            });
                        });
                    } else {
                        process.nextTick(function () {
                            cb(null);
                        });
                    }
                }

            ], function allDone(err, results) {
                if (self.getChildren().length < 1 && self.parent) {
                    notifyParentThatChildIsComplete(self.parent.testId, self.testId, function () {
                        ee.emit('test_complete');
                        finished();
                    });
                } else {
                    ee.emit('test_complete');
                    finished();
                }
            });

        };

        return new TestSuite(data);

    };

    return {
        //TestSuite: TestSuite,
        Maker: Maker
    };

}


module.exports = makeTestSuite;
