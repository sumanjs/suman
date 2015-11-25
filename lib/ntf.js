/**
 * Created by amills001c on 11/24/15.
 */


var async = require('async');


function describe(description, cb) {
    var suite = new TestSuite(description);
    cb.apply(suite, [suite]);
    suite.startSuite(function () {
        console.log('suite is done:', suite.description);
    });
    //suite.describeCallback = cb;
    //return suite;
}


function TestSuite(description) {
    this.description = description;
    this.testInc = 0;
    this.tests = [];
    this.testsParallel = [];
    this.befores = [];
    this.beforeEaches = [];
    this.afters = [];
    this.afterEaches = [];
    this.parallelState = false;
}

function ParallelTestSet() {
    this.tests = [];
}

ParallelTestSet.prototype.it = function (desc, cb) {
    this.tests.push({
        testId: 555,
        desc: desc,
        cb: cb,
        complete: false,
        error: null
    });
    return this;
};


TestSuite.prototype.it = function (desc, cb) {

    this.tests.push({
        testId: this.testInc++,
        desc: desc,
        cb: cb,
        complete: false,
        error: null
    });

    return this;
};

TestSuite.prototype.series = function (cb) {
    if(typeof cb === 'function'){
        cb(this.it);
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
    this.testsParallel.push(parTest);
    cb(parTest);
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
                        console.log('test name:', test.desc);

                        if (test.cb.length < 1) {
                            try {
                                test.cb();
                                cb(null);
                            }
                            catch (err) {
                                cb(null,err);
                            }
                        }
                        else {
                            try{
                                test.cb(function (err) {
                                    cb(null, err);
                                });
                            }
                            catch(err){
                                console.log('caught error in:',err);
                                cb(null,err);
                            }
                        }

                    }, function complete(err, results) {
                        console.log(err, results);
                        cb(null, err, results);
                    });

                }, function (cb) {
                    async.eachSeries(self.testsParallel, function (set, cb) { //run all parallel sets in series
                        async.each(set.tests, function (test, cb) {  //but individual sets of parallel tests can run in parallel

                            if (test.cb.length < 1) {
                                try {
                                    test.cb();
                                    cb(null);
                                }
                                catch (err) {
                                    cb(null,err);
                                }
                            }
                            else {
                                try{
                                    test.cb(function (err) {
                                        cb(null, err);
                                    });
                                }
                                catch(err){
                                    console.log('caught error in:',err);
                                    cb(null,err);
                                }
                            }

                        }, function done(err) {
                            cb(null, err)
                        });
                    }, function done(err) {
                        cb(null, err);
                    });
                }], function done() {
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


module.exports = describe;