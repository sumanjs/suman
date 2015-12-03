/**
 * Created by amills001c on 11/24/15.
 */


//note: http://stackoverflow.com/questions/20825157/using-spawn-function-with-node-env-production


//#core
var async = require('async');
var _ = require('underscore');
var debug = require('debug')('suman');
var colors = require('colors/safe');

//#local

var usingRunner = false;
var log = null;
var logErrors = null;
var grepSuite;
var errors = [];
var testErrors = [];

var incr = require('./incrementer');
var ParallelTestSet = require('./ParallelTestSet.js')(log);
var LoopTestSet = require('./LoopTestSet.js')(log);


process.on('exit', function () {

    if (testErrors.length > 0 || errors.length > 0) {
        if (usingRunner) {
            process.send({exitCode: 1, errors: errors, testErrors: testErrors});
        }
        else {
            console.error('errors present, exiting with code 1, errors: ' + JSON.stringify(errors) + ', testErrors: ' + JSON.stringify(testErrors));
        }
        process.exit(1);
    }
    else {
        if (usingRunner) {
            process.send({exitCode: 0, errors: errors, testErrors: testErrors});
        }
        else {
            console.error('no errors present, exiting with code 0');
        }
        process.exit(0);
    }

});


if (process.argv.indexOf('--grep-suite') !== -1) { //does our flag exist?
    grepSuite = process.argv[process.argv.indexOf('--grep-suite') + 1]; //grab the next item
    if (grepSuite && String(grepSuite).length > 0) {
        debug('grepSuite options present, before regex:' + grepSuite);
        grepSuite = new RegExp(grepSuite);
        debug('grepSuite options present, after regex:' + grepSuite);
    }
    else {
        debug('bad --grep-suite command');
        process.send({errors: [], msg: 'bad --grep-suite option passed to suite', fatal: true});
        process.exit(0);
    }
}


if (process.argv.indexOf('--runner') !== -1) { //does our flag exist?
    usingRunner = true;
}


function makeSuite(desc, cb) {

    if (grepSuite && !(String(desc).search(grepSuite) > -1)) {
        debug('--grep-suite option was passed with value: ' + grepSuite + 'and this didnt match the suite description with value:' + desc);
        process.send({errors: [], msg: 'grepSuite didnt match desc', fatal: false});
        process.exit(0);
    }
    else {
        var suite = new TestSuite(desc);
        console.log('suite is about to run:', suite.description);
        cb.apply(suite, [suite]);

        suite.startSuite(function (err, results) {
            console.log('suite is done:', suite.description);
            suite.mightHaveChildren = true;
            logErrors(suite); //note: this is imperative for getting testId=0 to be logged at all
            process.exit();
        });

    }

}

function makeGracefulExitOrNot(errs, cb) {

    errs = errs.filter(function (err) {
        if (err instanceof Error) {
            return err;
        }
        else if (!err) {
            return undefined;
        }
        else {
            console.error(colors.bgRed('non error passed'));
            return undefined;
        }
    }).map(function (err) {
        return err.message;
    });

    if (errs && errs.length > 0) {
        console.log('omg!!! errors:', errs);
        errs.forEach(function (err) {
            errors.push(err);
        });
        process.exit();
    }
    else {
        cb();
    }

}

function makeError(err, test) {
    if (err) {
        test.error = err.message;
        testErrors.push(test.error);
    }
    else {
        test.error = null;
    }
}


function TestSuite(desc, parent) {
    this.testId = incr();
    this.description = desc;
    this.children = [];
    this.tests = [];
    this.testsParallel = [];
    this.loopTests = [];
    this.befores = [];
    this.beforeEaches = [];
    this.afters = [];
    this.afterEaches = [];
}


TestSuite.prototype.describe = function (desc, cb) {
    var test = new TestSuite(desc);
    test.parent = this;
    this.children.push({testId: test.testId});
    console.log('test is about to be applied:', test.description);
    cb.apply(test, []);
    console.log('test is about to start:', test.description);
    test.startSuite(function () {
        console.log('    test is done > ' + test.description);
        logErrors(test);
    });
};


TestSuite.prototype.it = function (desc, cb) {

    this.tests.push({
        testId: incr(),
        type: 'it-standard',
        desc: desc,
        cb: cb,
        timedOut: false,
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
        cb.apply(this, []);
    }
    return this;
};


TestSuite.prototype.before = function (before) {
    this.befores.push(before);
    return this;
};

TestSuite.prototype.after = function (after) {
    this.afters.push(after);
    return this;
};

TestSuite.prototype.beforeEach = function (aBeforeEach) {
    this.beforeEaches.push(aBeforeEach);
    return this;
};

TestSuite.prototype.afterEach = function (aAfterEach) {
    this.afterEaches.push(aAfterEach);
    return this;
};


TestSuite.prototype.parallel = function (cb) {
    var self = this;
    var parTest = new ParallelTestSet();
    this.testsParallel.push(parTest);
    cb.apply(parTest, []);
    return this;
};


TestSuite.prototype.loop = function (arr, cb) {
    var self = this;
    var loopTest = new LoopTestSet();

    arr.forEach(function (item) {
        cb.apply(loopTest, [item]);
    });

    this.loopTests.push(loopTest);
    return this;
};


TestSuite.prototype.startSuite = function (finished) {

    var self = this;


    function handleBeforeEach(test, aBeforeEach, cb) {
        debug('aBeforeEach:', aBeforeEach);
        try {
            self.currentTest = test;
            aBeforeEach.apply(self, [function (err) {
                self.currentTest = null;
                cb(null, err);
            }]);
        }
        catch (err) {
            cb(null, err);
        }

    }

    function handleAfterEach(test, aAfterEach, cb) {
        debug('aAfterEach:', aAfterEach);
        try {
            self.currentTest = test;
            aAfterEach.apply(self, [function (err) {
                self.currentTest = null;
                cb(null, err);
            }]);
        }
        catch (err) {
            cb(null, err);
        }

    }


    function handleTest(test, cb) {

        debug('test:', test);

        /* if (test.cb.length < 1) {
         try {
         test.cb.apply(self, []);
         logErrors(test);
         cb(null);
         }
         catch (err) {
         makeError(err, test);
         logErrors(test);
         cb(null);
         }
         }
         else {
         try {

         var timer = setTimeout(function () {
         test.timedOut = true;
         test.error = 'timed out';
         logErrors(test);
         cb(null);
         }, 1000);

         test.cb.apply(self,[function (err) {
         if (!test.timedOut) {
         clearTimeout(timer);
         makeError(err, test);
         logErrors(test);
         cb(null);
         }
         }]);
         }
         catch (err) {
         console.error('caught error in:', err);
         makeError(err, test);
         logErrors(test);
         cb(null, err);
         }
         }*/
        /* if (test.cb.length < 1) {
         try {
         test.cb.apply(self, []);
         logErrors(test);
         cb(null);
         }
         catch (err) {
         makeError(err, test);
         logErrors(test);
         cb(null, err);
         }
         }
         else {
         try {

         var timer = setTimeout(function () {
         test.timedOut = true;
         test.error = 'timed out';
         logErrors(test);
         cb(null);
         }, 1000);

         test.cb.apply(self,[function (err) {
         if (!test.timedOut) {
         clearTimeout(timer);
         makeError(err, test);
         logErrors(test);
         cb(null, err);
         }
         }]);
         }
         catch (err) {
         console.error('caught error in:', err);
         makeError(err, test);
         logErrors(test);
         cb(null, err);
         }
         }*/

        if (test.cb.length < 1) {
            try {
                test.cb.apply(self, []);
                logErrors(test);
                cb(null);
            }
            catch (err) {
                makeError(err, test);
                logErrors(test);
                cb(null, err);
            }
        }
        else {
            try {

                var timer = setTimeout(function () {
                    test.timedOut = true;
                    makeError(new Error('timed out'), test);
                    logErrors(test);
                    cb(null);

                }, 2000);

                test.cb.apply(self, [function (err) {
                    if (!test.timedOut) {
                        clearTimeout(timer);
                        makeError(err, test);
                        logErrors(test);
                        cb(null, err);
                    }
                }]);
            }
            catch (err) {
                makeError(err, test);
                logErrors(test);
                console.error('caught error in:', err);
                cb(null, err);
            }
        }
    }


    async.series([
        function runBefores(cb) {
            async.mapSeries(self.befores, function (aBefore, cb) {
                try {
                    aBefore.apply(self, [function (err) {
                        cb(null, err);
                    }]);
                }
                catch (err) {
                    cb(null, err);
                }
            }, function complete(err, results) {
                makeGracefulExitOrNot(results, function () {
                    cb(null);
                });
            });
        },
        function runTests(cb) {

            async.series([function (cb) {
                async.eachSeries(self.tests, function (test, cb) {
                    async.mapSeries(self.beforeEaches, function (aBeforeEach, cb) {
                            handleBeforeEach(test, aBeforeEach, cb);
                        },
                        function doneWithBeforeEaches(err, results) {

                            makeGracefulExitOrNot(results, function () {

                                async.series([function (cb) {
                                    handleTest(test, cb);

                                }, function (cb) {
                                    async.mapSeries(self.afterEaches, function (aAfterEach, cb) {
                                        handleAfterEach(test, aAfterEach, cb);
                                    }, function done(err, results) {
                                        makeGracefulExitOrNot(results, function () {
                                            cb(null);
                                        });
                                    });

                                }], function doneWithTests(err, results) {
                                    cb(null, results);
                                })
                            });
                        });

                }, function complete(err, results) {
                    cb(null, results);
                });

            }, function (cb) {
                async.eachSeries(self.testsParallel, function ($set, cb) { //run all parallel sets in series
                    async.each($set.tests, handleTest, //but individual sets of parallel tests can run in parallel
                        function done(err, results) {
                            cb(null, results)
                        });
                }, function done(err, results) {
                    cb(null, results);
                });
            }, function (cb) {
                async.eachSeries(self.loopTests, function ($set, cb) { //run all parallel sets in series
                    async.each($set.tests, handleTest,  //but individual sets of parallel tests can run in parallel
                        function done(err, results) {
                            cb(null, results)
                        });
                }, function done(err, results) {
                    cb(null, results);
                });

            }], function doneWithAllTests(err, results) {
                cb(null, results);
            });

        },
        function runAfters(cb) {
            async.mapSeries(self.afters, function (aAfter, cb) {
                try {
                    aAfter.apply(self, [function (err) {
                        cb(null, err);
                    }]);
                }
                catch (err) {
                    cb(null, err);
                }
            }, function complete(err, results) {
                makeGracefulExitOrNot(results, function () {
                    cb(null);
                });
            });
        }

    ], function allDone(err, results) {
        finished();
    });

};


module.exports = {
    main: function ($log, $logErrors) {
        log = $log;
        logErrors = $logErrors;
        return makeSuite;
    }
};

