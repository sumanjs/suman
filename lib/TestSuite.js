/**
 * Created by amills001c on 12/28/15.
 */

//#core
const domain = require('domain');
const _ = require('underscore');
const async = require('async');

//#npm
const parseFunction = require('parse-function');
const debug_core = require('debug')('suman:core');
const debug_suman_test = require('debug')('suman:test');

//#project
const incr = require('./incrementer');
const makeSuiteLite = require('./make-suite-lite');
const makeHandleExtraOpts = require('./handle-extra-opts');
const SumanErrors = require('../config/suman-errors');
const utils = require('./utils');
const ee = require('./ee');
const makeTheTrap = require('./test-suite-helpers/make-the-trap');

///////////////////////////////////////////////////////////////////////

function makeTestSuite(suman, allTests, gracefulExit, testErrors) {

    const handleExtraOpts = makeHandleExtraOpts(suman);
    const ParallelTestSet = require('./ParallelTestSet')(suman);
    const LoopTestSet = require('./LoopTestSet')(suman);
    const runTheTrap = makeTheTrap(suman, allTests, gracefulExit, testErrors);

    function BS(obj) {

        this.testId = incr();
        this.isSetupComplete = false;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
        this.parallel = obj.parallel || false;
        this.skip = obj.skip || false;
        this.only = obj.only || false;

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

    Maker.new = function (data) {

        var it, describe;

        function TestSuite(obj) {

            this.desc = obj.desc;

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


            it = this.it = function (desc, opts, cb) {

                handleSetupComplete(this);

                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);

                desc = obj.desc;
                opts = obj.opts;
                cb = obj.cb;

                if (opts.skip) {
                    return this;
                }

                if (suman.itOnlyIsTriggered && !opts.only) {
                    debug_core('describeOnlyIsTriggered && and this describe is not an only, so skipped:' + desc);
                    return;
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


            describe = this.describe = function (desc, opts, cb) {

                handleSetupComplete(this);
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);

                desc = obj.desc;
                opts = obj.opts;
                cb = obj.cb;

                if (utils.isArrowFunction(cb)) {
                    throw new Error('You cannot use an arrow function with describe callbacks; however, you may use arrow functions everywhere else, except describes.')
                }

                if (opts.skip) {
                    debug_core('describe is skipped:' + desc);
                    return;
                }

                if (suman.describeOnlyIsTriggered && !opts.only) {
                    debug_core('describeOnlyIsTriggered && and this describe is not an only, so skipped:' + desc);
                    return;
                }

                if (this.parallel) {
                    if (opts.parallel === false) {
                        process.stdout.write('warning: parent describe is parallel, so child will be parallel also');
                    }
                    opts.parallel = true;  //note: if parent is parallel, child is also parallel because we say so
                }

                var test = Maker.new(_.extend({}, opts, {
                    desc: desc,
                    isDescribe: true
                }));

                test.parent = _.pick(this, 'testId');
                this.getChildren().push({testId: test.testId});
                allTests.push(test);

                debug_core('test is about to be applied: ' + test.desc);

                var parent = this;

                test.run = function run(callback) {

                    domain.create().on('error', function (err) {
                        console.error(err.stack);
                        suman.logData(test);
                        gracefulExit([err]);
                    }).run(function () {
                        try {
                            test.__bindExtras(test);
                            if (cb.length < 1) {
                                cb.apply(test, []);
                                test.isSetupComplete = true;
                                test.__bindExtras(parent);  //bind extras back to parent test
                                //callback(null);
                                test.__invokeChildren(callback);
                            }
                            else {
                                test.__proto__.isDelayed = true;
                                cb.apply(test, [function delay(err) {
                                    process.nextTick(function () {  //need to make sure delay is called asynchronously, but this should take care of it
                                        test.isSetupComplete = true;
                                        test.__bindExtras(parent);  //bind extras back to parent test
                                        test.__invokeChildren(callback); // pass callback
                                    });
                                }]);
                            }
                        }
                        catch (e) {
                            e.sumanStraightUpError = true;
                            throw e;
                        }
                    });
                };

                //if (!parent.isDelayed) {
                //    test.hasBeenRan = true;
                //    test.run();
                //}
                //else {
                //    test.hasBeenRan = false;
                //}

            };

        }

        TestSuite.prototype = Object.create(new BS(data));

        TestSuite.prototype.__bindExtrasToSelf = function bindExtrasToSelf(ctx, previousCtx) {

            describe.skip = describe.SKIP = function (desc, opts, cb) {

                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                describe.bind(this)(obj.desc, obj.opts, obj.cb);

            }.bind(ctx);

            describe.only = describe.ONLY = function (desc, opts, cb) {

                suman.describeOnlyIsTriggered = true;
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                describe.bind(this)(obj.desc, obj.opts, obj.cb);

            }.bind(ctx);

            it.skip = it.SKIP = function (desc, opts, cb) {

                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                return it.bind(this)(obj.desc, obj.opts, obj.cb);

            }.bind(ctx);

            it.only = it.ONLY = function (desc, opts, cb) {

                suman.itOnlyIsTriggered = true;
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                return it.bind(this)(obj.desc, obj.opts, obj.cb);

            }.bind(ctx);

            suman.ctx.currentCtx = ctx;
            suman.ctx.previousCtx = previousCtx;
        }

        TestSuite.prototype.__bindExtras = function bindExtras(ctx) {

            describe.skip = describe.SKIP = function (desc, opts, cb) {
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            }

            describe.only = describe.ONLY = function (desc, opts, cb) {
                suman.describeOnlyIsTriggered = true;
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                describe.bind(ctx)(obj.desc, obj.opts, obj.cb);
            }

            it.skip = it.SKIP = function (desc, opts, cb) {
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.skip = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.cb);
            }

            it.only = it.ONLY = function (desc, opts, cb) {
                suman.itOnlyIsTriggered = true;
                var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
                obj.opts.only = true;
                return it.bind(ctx)(obj.desc, obj.opts, obj.cb);
            }
        }

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

                    var lastChild = parent.getChildren()[parent.getChildren().length - 1];
                    if (lastChild.testId === childTestId) {
                        async.mapSeries(parent.getAfters(), handleBeforesAndAfters, function complete(err, results) {
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

                var done = _.once(makeCallback);

                var timeout = suman.weAreDebugging ? 500000 : 5000;

                var timer = setTimeout(function () {
                    done(aBeforeOrAfter.timeOutError);
                }, timeout);

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
                    async.mapSeries(self.getBefores(), handleBeforesAndAfters, function complete(err, results) {
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
                            fn2(self.getTests(), function (test, cb) {
                                runTheTrap(self, test, {
                                    parallel: false
                                }, cb);
                            }, function complete(err, results) {
                                cb(null, results);
                            });

                        }, function runParallelTests(cb) {
                            var flattened = _.flatten([self.getTestsParallel(), self.getLoopTests()], true).concat([{
                                tests: self.getParallelTests()
                            }]);
                            fn2(flattened, function ($set, cb) { //run all parallel sets in series
                                async.each($set.tests, function (test, cb) { //but individual sets of parallel tests can run in parallel
                                    runTheTrap(self, test, {
                                        parallel: true    //TODO: ?
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
                        async.mapSeries(self.getAfters(), handleBeforesAndAfters, function complete(err, results) {
                            gracefulExit(results, function () {
                                cb(null);
                            });
                        });
                    } else {
                        cb(null);
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

        }

        return new TestSuite(data);

    }
    return {
        //TestSuite: TestSuite,
        Maker: Maker
    };

}


module.exports = makeTestSuite;
