/**
 * Created by amills001c on 12/1/15.
 */


//#core
var _ = require('underscore');

var incr = require('./incrementer');
var makeHandleExtraOpts = require('./handle-extra-opts');


function makeLoopTestSet(suman) {

    var handleExtraOpts = makeHandleExtraOpts(suman);

    function LoopTestSet() {
        this.testId = incr();
        this.tests = [];
        this.type = 'LoopTestSet';
        this.parallel = true;
    }

    function handleSetupComplete(test) {
        if (test.isSetupComplete) {
            var e = new Error('You cannot call the following functions asynchronously - describe(), it(), before(), beforeEach(), after(), afterEach()\n- do not ' +
                'put these calls inside a setTimeout, setImmediate, process.nextTick or any other asynchronous calls. ***This includes nesting these calls inside each other.***\n' +
                'This is a fatal error because behavior will be completely indeterminate upon asynchronous registry of these calls.');
            e.sumanFatal = true;
            throw e;
        }
    }

    LoopTestSet.prototype.it = function (desc, opts, cb) {

        handleSetupComplete(this);

        var obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);

        desc = obj.desc;
        opts = obj.opts;
        cb = obj.cb;

        if (opts.skip) {
            return this;
        }

        cb.timeOutError = new Error('timed out - did you forget to call done()?');

        var testData = _.extend({}, opts, {
            testId: incr(),
            type: 'it-loop',
            opts: opts,
            desc: desc,
            data: {},
            cb: cb,
            timedOut: false,
            complete: false,
            error: null
        });

        this.tests.push(testData);
        return this;
    };

    LoopTestSet.prototype.log = function (data) {
        suman.log(data, this);
    };

    return LoopTestSet;

}


module.exports = makeLoopTestSet;