/**
 * Created by amills001c on 12/28/15.
 */



//#core
var domain = require('domain');
var _ = require('underscore');
var debug_core = require('debug')('suman:core');

//#local
var incr = require('./incrementer');
var makeSuiteLite = require('./make-suite-lite');
var makeHandleExtraOpts = require('./handle-extra-opts');
var SumanErrors = require('../config/suman-errors');


///////////////////////////////////////////////////////////////////////


function makeTestSuite(suman, startSuite, allTests, gracefulExit) {

    var handleExtraOpts = makeHandleExtraOpts(suman);
    var ParallelTestSet = require('./ParallelTestSet.js')(suman);
    var LoopTestSet = require('./LoopTestSet.js')(suman);


    function TestSuite(obj) {
        this.testId = incr();
        this.desc = obj.desc;
        this.isSetupComplete = false;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
        this.parallel = obj.parallel || false;
        this.skip = obj.skip || false;
        this.only = obj.only || false;
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

        if (opts.skip) {
            debug_core('describe is skipped:' + desc);
            return;
        }

        if (suman.describeOnlyIsTriggered && !opts.only) {
            debug_core('describeOnlyIsTriggered && and this describe is not an only, so skipped:' + desc);
            return;
        }

        if (this.parallel) {
            opts.parallel = true;  //note: if parent is parallel, child is also parallel
        }

        var test = new TestSuite(_.extend({}, opts, {
            desc: desc,
            isDescribe: true
        }));

        bindExtras(test, this);
        test.parent = _.pick(this, 'testId');
        this.children.push({testId: test.testId});
        allTests.push(test);

        debug_core('test is about to be applied: ' + test.desc);
        //var obj = makeSuiteLite(test);
        //var obj = test;
        var self = this;
        domain.create().on('error', function (err) {

            //console.error(err);
            suman.logData(test);
            gracefulExit([err]);

        }).run(function () {
            try {
                cb.apply(test, [test]);
                test.isSetupComplete = true;
                bindExtras(self, null);
            }
            catch (e) {
                e.sumanStraightUpError = true;
                throw e;
            }
        });
    };

    function bindExtras(ctx, previousCtx) {

        describe.skip = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.skip = true;
            describe.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        describe.only = function (desc, opts, cb) {

            suman.describeOnlyIsTriggered = true;
            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.only = true;
            describe.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        it.skip = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.skip = true;
            return it.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        it.only = function (desc, opts, cb) {

            suman.describeOnlyIsTriggered = true;
            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.only = true;
            return it.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        suman.ctx.currentCtx = ctx;
        suman.ctx.previousCtx = previousCtx;
    }


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


    var it = TestSuite.prototype.it = function (desc, opts, cb) {

        handleSetupComplete(this);

        var obj = handleExtraOpts(desc, opts, cb);

        desc = obj.desc;
        opts = obj.opts;
        cb = obj.cb;

        if (opts.skip) {
            return this;
        }

        var testData = _.extend({}, opts, {
            testId: incr(),
            data: {},
            //opts: opts,
            type: 'it-standard',
            desc: desc,
            cb: cb,
            timedOut: false,
            complete: false,
            error: null
        });

        testData.cb.timeOutError = new Error('timed out - did you forget to call done()?');

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


    TestSuite.prototype.before = function (desc, before) {
        handleSetupComplete(this);
        var obj = handleOptionalDesc(desc, before);
        var fn = obj.fn;
        fn.type = 'before';
        fn.timeOutError = new Error('timed out - did you forget to call done()?');
        this.befores.push(fn);
        return this;
    };

    TestSuite.prototype.after = function (desc, after) {
        handleSetupComplete(this);
        var obj = handleOptionalDesc(desc, after);
        var fn = obj.fn;
        fn.type = 'after';
        fn.timeOutError = new Error('timed out - did you forget to call done()?');
        this.afters.push(fn);
        return this;
    };

    TestSuite.prototype.beforeEach = function (desc, aBeforeEach) {
        handleSetupComplete(this);
        var obj = handleOptionalDesc(desc, aBeforeEach);
        var fn = obj.fn;
        fn.type = 'beforeEach';
        fn.timeOutError = new Error('timed out - did you forget to call done()?');
        this.beforeEaches.push(fn);
        return this;
    };

    TestSuite.prototype.afterEach = function (desc, aAfterEach) {
        handleSetupComplete(this);
        var obj = handleOptionalDesc(desc, aAfterEach);
        var fn = obj.fn;
        fn.type = 'afterEach';
        fn.timeOutError = new Error('timed out - did you forget to call done()?');
        this.afterEaches.push(fn);
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
