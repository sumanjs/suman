/**
 * Created by amills001c on 11/24/15.
 */


//#core
var async = require('async');

//#local
//var ParallelTestSet = require('./parallelTestSet');

var testId = 0;
var log = null;
var logErrors = null;

function define(description, cb) {
    var suite = new TestSuite(description);
    cb.apply(suite, [suite]);
    suite.startSuite(function () {
        console.log('suite is done:', suite.description);
        logErrors(null, suite);
    });
    //suite.describeCallback = cb;
    //return suite;
}


function ParallelTestSet() {
    this.testId = testId++;
    this.tests = [];
    this.type = 'ParallelTestSet';
}

ParallelTestSet.prototype.it = function (desc, cb) {
    this.tests.push({
        testId: testId++,
        desc: desc,
        cb: cb,
        complete: false,
        error: null
    });
    return this;
};

ParallelTestSet.prototype.log = function (data) {
    log(data, this);
};


function LoopTestSet() {
    this.testId = testId++;
    this.tests = [];
    this.type = 'LoopTestSet';
}

LoopTestSet.prototype.it = function (desc, cb) {
    this.tests.push({
        testId: testId++,
        desc: desc,
        cb: cb,
        complete: false,
        error: null
    });
    return this;
};

LoopTestSet.prototype.log = function (data) {
    log(data, this);
};


function TestSuite(description, parent) {
    this.testId = testId++;
    this.description = description;
    //this.parent = parent || null;
    this.children = [];
    this.testInc = 0;
    this.tests = [];
    this.testsParallel = [];
    this.loopTests = [];
    this.befores = [];
    this.beforeEaches = [];
    this.afters = [];
    this.afterEaches = [];
}


TestSuite.prototype.describe = function (desc, cb) {
    var suite = new TestSuite(desc);
    this.children.push({testId: suite.testId});
    cb.apply(suite, [suite]);
    suite.startSuite(function () {
        console.log('suite is done:', suite.description);
        logErrors(null, suite);
    });
};


TestSuite.prototype.it = function (desc, cb) {
    this.tests.push({
        testId: testId++,
        desc: desc,
        cb: cb,
        complete: false,
        error: null
    });
    return this;
};


TestSuite.prototype.log = function (data) {
    log(data, this);
};

TestSuite.prototype.series = function (cb) {
    if (typeof cb === 'function') {
        cb(this);
    }
    return this;
};


TestSuite.prototype.before = function (before) {
    this.befores.push(before);
    return this;
};

TestSuite.prototype.parallel = function (cb) {
    var self = this;
    var parTest = new ParallelTestSet();
    //this.children.push(parTest.testId);
    this.testsParallel.push(parTest);
    cb.apply(this, [parTest]);
    return this;
};

TestSuite.prototype.loop = function (arr, cb) {
    var self = this;
    var loopTest = new LoopTestSet();

    arr.forEach(function (item) {
        cb.apply(this, [loopTest, item]);
    });

    this.loopTests.push(loopTest);
    return this;
};

TestSuite.prototype.after = function (after) {
    this.afters.push(after);
    return this;
};


TestSuite.prototype.afterEach = function () {
    return this;
};

TestSuite.prototype.beforeEach = function () {
    return this;
};


TestSuite.prototype.startSuite = function (finished) {

    var self = this;

    process.nextTick(function () {
        async.series([
            function runBefores(cb) {
                console.log('self.befores.length:', self.befores.length);
                async.eachSeries(self.befores, function (aBefore, cb) {
                    aBefore.apply(self, [function (err) {
                        cb(null, err);
                    }]);
                }, function complete(err) {
                    cb(err);
                });
            },
            function runTests(cb) {

                async.series([function (cb) {
                    console.log('self.tests.length:', self.tests.length);
                    async.eachSeries(self.tests, function (test, cb) {
                        console.log('test:', test);

                        if (test.cb.length < 1) {
                            try {
                                test.cb();
                                logErrors(null, test);
                                cb(null);
                            }
                            catch (err) {
                                logErrors(err, test);
                                cb(null, err);
                            }
                        }
                        else {
                            try {
                                test.cb(function (err) {
                                    logErrors(err, test);
                                    cb(null, err);
                                });
                            }
                            catch (err) {
                                logErrors(err, test);
                                console.log('caught error in:', err);
                                cb(null, err);
                            }
                        }

                    }, function complete(err, results) {
                        console.log(err, results);
                        cb(null, err, results);
                    });

                }, function (cb) {
                    async.eachSeries(self.testsParallel, function ($set, cb) { //run all parallel sets in series
                        async.each($set.tests, function (test, cb) {  //but individual sets of parallel tests can run in parallel
                            console.log('test:', test);
                            if (test.cb.length < 1) {
                                try {
                                    test.cb();
                                    logErrors(null, test);
                                    cb(null);
                                }
                                catch (err) {
                                    logErrors(err, test);
                                    cb(null, err);
                                }
                            }
                            else {
                                try {
                                    test.cb(function (err) {
                                        logErrors(err, test);
                                        cb(null, err);
                                    });
                                }
                                catch (err) {
                                    console.log('caught error in:', err);
                                    logErrors(err, test);
                                    cb(null, err);
                                }
                            }

                        }, function done(err) {
                            cb(null, err)
                        });
                    }, function done(err) {
                        cb(null, err);
                    });
                }, function (cb) {

                    async.eachSeries(self.loopTests, function ($set, cb) { //run all parallel sets in series
                        async.each($set.tests, function (test, cb) {  //but individual sets of parallel tests can run in parallel
                            console.log('test:', test);
                            if (test.cb.length < 1) {
                                try {
                                    test.cb();
                                    logErrors(null, test);
                                    cb(null);
                                }
                                catch (err) {
                                    logErrors(err, test);
                                    cb(null, err);
                                }
                            }
                            else {
                                try {
                                    test.cb(function (err) {
                                        logErrors(err, test);
                                        cb(null, err);
                                    });
                                }
                                catch (err) {
                                    console.log('caught error in:', err);
                                    logErrors(err, test);
                                    cb(null, err);
                                }
                            }

                        }, function done(err) {
                            cb(null, err)
                        });
                    }, function done(err) {
                        cb(null, err);
                    });


                }], function doneWithAllTests() {
                    cb();
                });

            },
            function runAfters(cb) {
                console.log('self.afters.length:', self.afters.length);
                async.eachSeries(self.afters, function (aAfter, cb) {
                    aAfter.apply(self, [function (err) {
                        cb(null, err);
                    }]);
                }, function complete(err) {
                    cb(err);
                });
            }

        ], function allDone() {
            finished();
        });
    });


};


//module.exports = define;

module.exports = {
    LoopTestSet:LoopTestSet,
    ParallelTestSet:ParallelTestSet,
    main: function ($log, $logErrors) {
        log = $log;
        logErrors = $logErrors;
        return define;
    }
};

