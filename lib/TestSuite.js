/**
 * Created by amills001c on 12/28/15.
 */


var incr = require('./incrementer');
var _ = require('underscore');
var debug = require('debug')('suman');

//local
var makeSuiteLite = require('./make-suite-lite');

function makeTestSuite(suman, startSuite, allTests, gracefulExit) {

    var ParallelTestSet = require('./ParallelTestSet.js')(suman);
    var LoopTestSet = require('./LoopTestSet.js')(suman);


    function TestSuite(obj) {
        this.testId = incr();
        this.description = obj.desc;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
        this.children = [];
        this.tests = [];
        this.parallelTests = [];
        this.testsParallel = [];
        this.loopTests = [];
        this.befores = [];
        this.beforeEaches = [];
        this.afters = [];
        this.afterEaches = [];
    }


    TestSuite.prototype.describe = function (desc, cb) {
        var test = new TestSuite({desc: desc, isDescribe: true});
        test.parent = _.pick(this, 'testId');
        this.children.push({testId: test.testId});
        allTests.push(test);

        try {
            debug('test is about to be applied: ' + test.description);
            var obj = makeSuiteLite(test);
            //var obj = test;
            cb.apply(obj, []);
        }
        catch (err) {
            console.error(err);
            gracefulExit([err]);
        }
        finally {
            suman.logData(test);
        }

    };


    TestSuite.prototype.it = function (desc, opts, cb) {

        if(typeof desc !== 'string'){
            throw new Error('first argument to this.it() must be a string');
        }

        if(typeof opts === 'function'){
            cb = opts;
            opts = {};
        }
        else if(typeof opts !== 'object'){
            throw new Error('opts is not an object');
        }

        var testData = {
            testId: incr(),
            data: {},
            opts:opts,
            type: 'it-standard',
            desc: desc,
            cb: cb,
            timedOut: false,
            complete: false,
            error: null
        };

        if(opts.parallel){
            this.parallelTests.push(testData);
        }
        else{
            this.tests.push(testData);
        }



        return this;
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

        arr.forEach(function (item, index) {
            cb.apply(loopTest, [item, index]);
        });

        //suman.logData(loopTest);
        this.loopTests.push(loopTest);
        return this;
    };

    TestSuite.prototype.startSuite = function (finished) {
        return startSuite.bind(this)(finished);
    };


    return TestSuite;

}


module.exports = makeTestSuite;
