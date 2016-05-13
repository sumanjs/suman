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
const cloneError = require('../clone-error');
const TestCase = require('../t-proto-test');


module.exports = function init(suman, gracefulExit) {   //TODO: can possibly remove outer closure here

    return function handleTest(self, test, cb) {

        if (test.stubbed || test.skipped) {
            process.nextTick(cb);
        }
        else {

            const timerObj = {
                timer: setTimeout(onTimeout, global.weAreDebugging ? 5000000 : test.timeout)
            };

            const d = domain.create();
            d._sumanTest = true;

            const assertCount = {
                num: 0
            };

            const fini = helpers.makeCallback(d, assertCount, test, null, timerObj, 'test', cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);


            function onTimeout() {
                test.timedOut = true;
                fini(cloneError(test.warningErr, constants.warnings.TEST_CASE_TIMED_OUT_ERROR), true);
            }

            var derror = false;

            function handleError(err) {

                const stk = err.stack || err;

                if (!derror) {
                    derror = true;
                    clearTimeout(timerObj.timer);
                    err.sumanFatal = global.sumanOpts.bail ? true : false;
                    if (err.sumanFatal) {
                        err.sumanExitCode = constants.EXIT_CODES.TEST_ERROR_AND_BAIL_IS_TRUE;
                    }
                    //note: we need to call done asap instead of in process.nextTick otherwise it can be called by another location
                    fini(err);
                }
                else {
                    global._writeTestError(' => Suman error => Error in hook => \n' + stk);
                }
            }

            d.on('error', handleError);

            d.run(function () {

                process.nextTick(function () {

                    var warn = false;
                    var isAsyncAwait = false;


                    const str = test.fn.toString();

                    if (str.indexOf('Promise') > 0 || str.indexOf('async') === 0) {  //TODO: this check needs to get updated, async functions should return promises implicitly
                        warn = true;
                    }

                    const args = fnArgs(test.fn);
                    const isGeneratorFn = sumanUtils.isGeneratorFn(test.fn);

                    function confirm() {
                        assertCount.num++;
                    }

                    var planCalled = false;

                    function plan(num) {
                        if (!planCalled) {
                            assert(typeof num === 'number');
                            test.plan = num;
                        }
                    }

                    function timeout(val) {
                        timerObj.timer = setTimeout(onTimeout, global.weAreDebugging ? 500000 : val);
                    }

                    function $throw(str) {
                        handleError(str instanceof Error ? str : new Error(str));
                    }

                    function slow() {
                        //TODO
                    }

                    function handle(fn) {
                        try {
                            fn.apply(self, []);
                        }
                        catch (e) {
                            handleError(e);
                        }
                    }

                  /*

                  const t = {
                        slow: slow,
                        timeout: timeout,
                        throw: $throw,
                        plan: plan,
                        confirm: confirm,
                        handleAssertions: handle,
                        value: test.value,
                        data: test.data,
                        desc: String(test.desc),
                        testId: test.testId,
                        assert: null,

                    };

                    */

                    const t = new TestCase(handleError);
                    t.plan = plan;
                    t.confirm = confirm;
                    t.desc = t.title = test.desc;
                    t.data = test.data;
                    t.handleAssertions = handle;
                    t.value = test.value;
                    t.testId = test.testId;
                    t.throw = $throw;
                    t.timeout = timeout;

                    args.splice(0, 1, t);


                    test.dateStarted = Date.now();

                    if (isGeneratorFn) {
                        if (test.cb === true) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }
                        handleGenerator(test.fn, args, self);
                    }
                    else if (test.cb === true) {

                        t.callbackMode = true;

                        //if (!sumanUtils.checkForValInStr(test.fn.toString(), /done/g)) {
                        //    throw test.fn.NO_DONE;
                        //}

                        if(test.fn.apply(self, args)){
                            console.error(cloneError(test.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                        }

                    }
                    else {
                        handlePotentialPromise(test.fn.apply(self, args), warn);
                    }

                });

            });

        }
    }
};