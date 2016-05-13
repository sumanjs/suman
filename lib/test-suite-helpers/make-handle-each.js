/**
 * Created by denman on 3/13/2016.
 */

//#core
const domain = require('domain');
const assert = require('assert');

//#npm
const _ = require('lodash');
const fnArgs = require('function-arguments');
const helpers = require('./handle-callback-helpers');

//#project
const sumanUtils = require('../utils');
const constants = require('../../config/suman-constants');
const cloneError = require('../clone-error');
const HookObj = require('../t-proto-hook');

module.exports = function (suman, gracefulExit) {

    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb) {

        if (test.skipped || test.stubbed) {
            process.nextTick(cb);
        }
        else {

            const timerObj = {
                timer: setTimeout(onTimeout, global.weAreDebugging ? 5000000 : 5000)
            };

            const d = domain.create();
            d._suman = true;

            const fini = helpers.makeCallback(d, null, null, aBeforeOrAfterEach, timerObj, 'beforeEach/afterEach', cb);

            function onTimeout() {
                fini(cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR), true);
            }

            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);


            var dError = false;

            function handleError(err) {
                const stk = err.stack || err;
                if (!dError) {
                    dError = true;
                    if (aBeforeOrAfterEach.fatal === false) {
                        console.error(' => Suman non-fatal error => Error in hook but "fatal" option for the hook is set to false => \n' + stk);
                        fini(null);
                    }
                    else {
                        //note we want to exit right away, that's why this is commented out :)
                        err = new Error(' => fatal error in hook => (to continue even in the event of an error in a hook use option {fatal:false}) =>' + '\n' + err.stack);
                        err.sumanFatal = true;
                        err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
                        gracefulExit([err]);  //always fatal error in beforeEach/afterEach
                    }
                }
                else {
                    global._writeTestError(' => Suman error => Error in hook => \n' + stk);
                }
            }

            d.on('error', handleError);

            d.run(function () {

                process.nextTick(function () {

                    var isAsyncAwait = false;

                    const str = aBeforeOrAfterEach.fn.toString(); //TODO: need to check if it's a promise instead of a function if we go that route
                    const args = fnArgs(aBeforeOrAfterEach.fn);
                    const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfterEach.fn);

                    if (str.indexOf('async') === 0) {
                        isAsyncAwait = true;
                    }

                    //TODO: need to implement all assert methods

                    function timeout(val) {
                        timerObj.timer = setTimeout(onTimeout, global.weAreDebugging ? 500000 : val);
                    }


                    const t = new HookObj(fini, handleError);
                    t.timeout = timeout;
                    t.data = test.data;
                    t.desc = t.title = test.desc;
                    t.value = test.value;
                    t.testId = test.testId;

                    args.splice(0, 1, t);

                    if (isGeneratorFn) {
                        if (aBeforeOrAfterEach.cb) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }

                        handleGenerator(aBeforeOrAfterEach.fn, args, aBeforeOrAfterEach.ctx);
                    }
                    else if (aBeforeOrAfterEach.cb) {

                        t.callbackMode = true;

                        //if (!sumanUtils.checkForValInStr(aBeforeOrAfterEach.toString(), /done/g)) {
                        //    throw aBeforeOrAfterEach.NO_DONE;
                        //}

                        if (aBeforeOrAfterEach.fn.apply(aBeforeOrAfterEach.ctx, args)) { //TODO: apply(null) is correct?
                            console.error(cloneError(aBeforeOrAfterEach.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                        }

                    }
                    else {

                        handlePotentialPromise(aBeforeOrAfterEach.fn.apply(aBeforeOrAfterEach.ctx, args), false);
                    }

                });

            });

        }

    }

};