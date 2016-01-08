/**
 * Created by amills001c on 12/28/15.
 */


var incr = require('./incrementer');
var _ = require('underscore');
var debug = require('debug')('suman');

//local
var makeSuiteLite = require('./make-suite-lite');
var handleExtraOpts = require('./handle-extra-opts');

function makeTestSuite(suman, startSuite, allTests, gracefulExit) {

    var ParallelTestSet = require('./ParallelTestSet.js')(suman);
    var LoopTestSet = require('./LoopTestSet.js')(suman);


    function TestSuite(obj) {
        this.testId = incr();
        this.desc = obj.desc;
        //this.cb = obj.cb.bind(this);
        this.isSetupComplete = false;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
        this.parallel = obj.parallel || false;
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


    var describe = TestSuite.prototype.describe = function (desc, opts, cb) {

        handleSetupComplete(this);
        var obj = handleExtraOpts(desc, opts, cb);

        desc = obj.desc;
        opts = obj.opts;
        cb = obj.cb;

        if (this.parallel) {
            opts.parallel = true;
        }

        var test = new TestSuite({
            desc: desc,
            isDescribe: true,
            parallel: opts.parallel  //note: if parent is parallel, child is also parallel
        });

        bindExtras(test, this);
        test.parent = _.pick(this, 'testId');
        this.children.push({testId: test.testId});
        allTests.push(test);

        try {
            debug('test is about to be applied: ' + test.desc);
            //var obj = makeSuiteLite(test);
            var obj = test;
            cb.apply(obj, [obj]);
            test.isSetupComplete = true;
            bindExtras(this, null);
        }
        catch (err) {
            console.error(err);
            gracefulExit([err]);
        }
        finally {
            suman.logData(test);
        }

    };

    function bindExtras(ctx, previousCtx) {

        describe.skip = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.skip = true;
            describe.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        describe.only = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.only = true;
            describe.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        it.skip = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.only = true;
            return it.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        it.only = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.only = true;
            return it.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        suman.ctx.currentCtx = ctx;
        suman.ctx.previousCtx = previousCtx;
    }


    function handleSetupComplete(test) {
        if (test.isSetupComplete) {
            throw new Error('You cannot call the following functions asynchronously - it(), before(), beforeEach(), after(), afterEach()\n- do not ' +
                'put them these calls inside a setTimeout, setImmediate, process.nextTick or any other asynchronous calls.');
        }
    }

    TestSuite.prototype.toString = function () {
        return this.constructor + ':' + this.desc;
    };


    var it = TestSuite.prototype.it = function (desc, opts, cb) {

        handleSetupComplete(this);

        var obj = handleExtraOpts(desc, opts, cb);

        desc = obj.desc;
        opts = obj.opts;
        cb = obj.cb;

        var testData = {
            testId: incr(),
            data: {},
            opts: opts,
            type: 'it-standard',
            desc: desc,
            cb: cb,
            timedOut: false,
            complete: false,
            error: null
        };

        if (opts.parallel || this.parallel) {
            this.parallelTests.push(testData);
        }
        else {
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
        handleSetupComplete(this);
        this.befores.push(before);
        return this;
    };

    TestSuite.prototype.after = function (after) {
        handleSetupComplete(this);
        this.afters.push(after);
        return this;
    };

    TestSuite.prototype.beforeEach = function (aBeforeEach) {
        handleSetupComplete(this);
        this.beforeEaches.push(aBeforeEach);
        return this;
    };

    TestSuite.prototype.afterEach = function (aAfterEach) {
        this.afterEaches.push(aAfterEach);
        return this;
    };


    TestSuite.prototype.runParallel = function (cb) {
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


    return {
        TestSuite: TestSuite,
        bindExtras: bindExtras
    };

}


module.exports = makeTestSuite;
