/**
 * Created by amills001c on 12/28/15.
 */


var incr = require('./incrementer');


function makeTestSuite(suman, startSuite, allTests) {

    var ParallelTestSet = require('./ParallelTestSet.js')(suman);
    var LoopTestSet = require('./LoopTestSet.js')(suman);


    function TestSuite(obj) {
        this.testId = incr();
        this.description = obj.desc;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
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
        var test = new TestSuite({desc: desc, isDescribe: true});
        test.parent = this;
        this.children.push({testId: test.testId});
        console.log('test is about to be applied:', test.description);
        allTests.push(test);

        try {
            cb.apply(test, []);
        }
        catch (err) {
            console.error(err);
        }

        suman.logErrors(test);

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

        arr.forEach(function (item) {
            cb.apply(loopTest, [item]);
        });

        suman.logErrors(loopTest);
        this.loopTests.push(loopTest);
        return this;
    };

    TestSuite.prototype.startSuite = function (finished) {
        return startSuite.bind(this)(finished);
    };


    return TestSuite;

}


module.exports = makeTestSuite;
