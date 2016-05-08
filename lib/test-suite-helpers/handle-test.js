/**
 * Created by denman on 3/13/2016.
 */


//#core
const domain = require('domain');
const assert = require('assert');

//#npm
const fnArgs = require('function-arguments');
const _ = require('lodash');

//#project
const constants = require('../../config/suman-constants');
const sumanUtils = require('../utils');
const helpers = require('./handle-callback-helpers');


module.exports = function init(suman, gracefulExit) {   //TODO: can possibly remove outer closure here

    return function handleTest(self, test, cb) {

        if (test.stubbed || test.skipped) {
            process.nextTick(cb);
        }
        else {

            const timeout = global.weAreDebugging ? 500000 : test.timeout;
            var timer = setTimeout(onTimeout, timeout);

            const d = domain.create();
            d._sumanTest = true;

            const assertCount = {
                num: 0
            };

            const fini = helpers.makeCallback(d, assertCount, test, null, timer, 'test', cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);


            function onTimeout() {
                test.timedOut = true;
                fini(test.fn.timeOutError, true);
            }

            var dError = false;
            d.on('error', function (err) {

                if (!dError) {
                    dError = true;
                    clearTimeout(timer);

                    err.sumanFatal = global.sumanOpts.bail ? true : false;
                    if (err.sumanFatal) {
                        err.sumanExitCode = constants.EXIT_CODES.TEST_ERROR_AND_BAIL_IS_TRUE;
                    }
                    //TODO: we need to call done asap instead of in process.nextTick otherwise it can be called by another location
                    process.nextTick(function () {
                        fini(err);
                    });
                }
                else {
                    console.error(err.stack || err);
                }

            });

            d.run(function () {

                process.nextTick(function () {

                    var warn = false;
                    var isAsyncAwait = false;

                    test.dateStarted = Date.now();

                    const str = test.fn.toString();

                    if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {  //TODO: this check needs to get updated, async functions should return promises implicitly
                        warn = true;
                    }

                    const args = fnArgs(test.fn);
                    const isGeneratorFn = sumanUtils.isGeneratorFn(test.fn);

                    function assertWrapper() {
                        assertCount.num++;
                        try {
                            assert.apply(global, arguments);
                        }
                        catch (err) {
                            test.errors = test.errors || [];
                            test.errors.push(err.stack);
                        }
                    }

                    function log() {  //TODO: update this
                        global._writeLog.apply(null, arguments);
                    }

                    function plan(){
                        if(test.plan === false){
                            test.plan = true;
                            t.assert = assertWrapper;
                        }

                    }

                    function timeout(val){
                        timer = setTimeout(global.weAreDebugging ? 500000: val);
                    }

                    const t = {
                        timeout: timeout,
                        plan: plan,
                        value: test.value,
                        log: log,
                        data: test.data,
                        desc: String(test.desc),
                        testId: test.testId,
                        assert: null,
                        done: null,
                        pass: null,
                        fatal: null,
                        fail: null
                    };

                    args.splice(0, 1, t);

                    if (isGeneratorFn) {
                        if (test.cb === true) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }
                        handleGenerator(test.fn, args, self);
                    }
                    else if (test.cb === true) {

                        //if (!sumanUtils.checkForValInStr(test.fn.toString(), /done/g)) {
                        //    throw test.fn.NO_DONE;
                        //}

                        t.done = function done(err) {
                            if (err) {
                                err.sumanFatal = global.sumanOpts.bail ? true : false;
                            }
                            fini(err);
                        };

                        t.pass = function pass() {
                            fini(null);   //TODO: use spread operator here?
                        };

                        t.fail = function fail(err) {
                            err = err || new Error('fail() was called on test, but null/undefined value was passed as first arg to the fail function.');
                            err.sumanFatal = global.sumanOpts.bail ? true : false;
                            fini(err);
                        };

                        t.fatal = function fatal(err) {
                            err = err || new Error('Temp error since user did not provide one.');
                            err.sumanFatal = true;
                            fini(err);
                        };

                        args.splice(1, 1, function done(err) {   // note: for backwards compatibility with Mocha
                            if (err) {
                                err.sumanFatal = global.sumanOpts.bail ? true : false;
                            }
                            fini(err);
                        });

                        test.fn.apply(self, args)
                    }
                    else {
                        handlePotentialPromise(test.fn.apply(self, args), warn);
                    }

                });

            });

        }
    }
};