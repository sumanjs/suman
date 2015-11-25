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


TestSuite.prototype.it = function (desc, cb) {
    if(this.parallelState){

    }
    else{
        this.tests.push({
            testId: this.testInc++,
            desc: desc,
            cb: cb,
            complete: false,
            error: null
        });
    }

    return this;
};


TestSuite.prototype.before = function (before) {
    this.befores.push(before);
    return this;
};

TestSuite.prototype.parallel = function (cb) {
    this.parallelState = true;
    var self = this;
    var par = cb();

    this.parallelTests.forEach(function (test) {
        par.push({
            testId: self.testInc++,
            desc: desc,
            cb: cb,
            complete: false,
            error: null
        });
    });
    this.testsParallel.push(par);
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
                async.eachSeries(self.befores, function (aBefore, cb) {
                    aBefore.apply(self, [cb]);
                }, function complete(err) {
                    cb(err);
                });
            },
            function runTests(cb) {

                async.series([function (cb) {

                    async.eachSeries(self.tests, function (test, cb) {
                        console.log('test name:', test.desc);
                        test.cb(function (err) {
                            cb(null, err);
                        });

                    }, function complete(err, results) {
                        console.log(err, results);
                        cb(err);
                    });

                }, function (cb) {
                    async.eachSeries(self.testsParallel, function (tests, cb) {

                        async.each(tests,function(test,cb){

                        },function done(err){
                            cb(err)
                        });
                    });
                }
                ], function done(){
                    cb();
                });

            },
            function runAfters(cb) {
                async.eachSeries(self.afters, function (aAfter, cb) {
                    aAfter.apply(self, [cb]);
                }, function complete(err) {
                    cb(err);
                });
            }

        ], function allDone() {
            finished();
        });
    });


};


module.exports = {
    describe: describe
};