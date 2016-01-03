/**
 * Created by amills001c on 12/28/15.
 */


var incr = require('./incrementer');
var _ = require('underscore');
var debug = require('debug')('suman');

//local
var makeSuiteLite = require('./make-suite-lite');
var handleExtraOpts = require('./handle-extra-opts');

//var currentCTX = null;
//var skippingInner = false;

function makeTestSuite(suman, startSuite, allTests, gracefulExit) {

    var ParallelTestSet = require('./ParallelTestSet.js')(suman);
    var LoopTestSet = require('./LoopTestSet.js')(suman);


    function TestSuite(obj) {
        this.testId = incr();
        this.description = obj.desc;
        this.isTopLevel = obj.isTopLevel || undefined;
        this.isDescribe = obj.isDescribe || undefined;
        this.isParallel = obj.isParallel || false;
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

        var obj = handleExtraOpts(desc, opts, cb);

        desc = obj.desc;
        opts = obj.opts;
        cb = obj.cb;

        if(this.isParallel){
            opts.isParallel = true;
        }

        var test = new TestSuite({
            desc: desc,
            isDescribe: true,
            isParallel: opts.isParallel  //if parent is parallel, child is also parallel
        });

        bindDescribeExtras(test);
        bindItExtras(test);
        test.parent = _.pick(this, 'testId');
        this.children.push({testId: test.testId});
        allTests.push(test);

        try {
            debug('test is about to be applied: ' + test.description);
            //var obj = makeSuiteLite(test);
            var obj = test;
            cb.apply(obj, []);
            bindDescribeExtras(suman.ctx.currentCtx);
            bindItExtras(suman.ctx.currentCtx);
        }
        catch (err) {
            console.error(err);
            gracefulExit([err]);
        }
        finally {
            suman.logData(test);
        }

    };

    function bindDescribeExtras(ctx){

        describe.skip = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.skip = true;
            skippingInner = true;
            describe.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        describe.only = function (desc, opts, cb) {

            var obj = handleExtraOpts(desc, opts, cb);
            obj.opts.only = true;
            describe.bind(this)(obj.desc, obj.opts, obj.cb);

        }.bind(ctx);

        suman.ctx.currentCtx = ctx;

    }

    function bindItExtras(ctx){

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
    }


    var it = TestSuite.prototype.it = function (desc, opts, cb) {

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

        if (opts.parallel || this.isParallel) {
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


    //new TestSuite({desc:'foo'}).it('baz',function(){}).describe('bar',{},function(){}); //need this...

    return {
        TestSuite:TestSuite,
        bindDescribeExtras:bindDescribeExtras,
        bindItExtras:bindItExtras
    };

}


module.exports = makeTestSuite;
