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

module.exports = function (suman, gracefulExit) {

    return function handleBeforeOrAfterEach(self, test, aBeforeOrAfterEach, cb) {

        if (test.skipped || test.stubbed) {
            process.nextTick(cb);
        }
        else {
            const timeout = global.weAreDebugging ? 500000 : 5000;

            const timer = setTimeout(function () {
                fini(aBeforeOrAfterEach.timeOutError);
            }, timeout);

            const d = domain.create();
            d._suman = true;

            const fini = helpers.makeCallback(d, null, null, aBeforeOrAfterEach, timer, 'beforeEach/afterEach', cb);
            const handlePotentialPromise = helpers.handlePotentialPromise(fini);
            const handleGenerator = helpers.makeHandleGenerator(fini);

            var dError = false;
            d.on('error', function (err) {

                const stk = err.stack || err;

                if (!dError) {
                    dError = true;

                    if (aBeforeOrAfterEach.fatal === false) {
                        console.error(' => Suman non-fatal error => Error in hook and "fatal" option for the hook is set to false => \n' + stk);
                    }
                    else {
                        // process.nextTick(function () {  //note we want to exit right away
                        err = new Error(' => fatal error in hook => (to continue even in the event of an error in a hook use option {fatal:false}) =>' + '\n' + err.stack);
                        err.sumanFatal = true;
                        err.sumanExitCode = constants.EXIT_CODES.FATAL_HOOK_ERROR;
                        gracefulExit([err]);  //always fatal error in beforeEach/afterEach
                        // });
                    }
                }
                else {
                    console.error(err.stack || err);
                }
            });

            d.run(function () {

                process.nextTick(function () {

                    var isAsyncAwait = false;

                    const str = aBeforeOrAfterEach.fn.toString(); //TODO: need to check if it's a promise instead of a function if we go that route
                    const args = fnArgs(aBeforeOrAfterEach.fn);
                    const isGeneratorFn = sumanUtils.isGeneratorFn(aBeforeOrAfterEach.fn);

                    if (str.indexOf('async') === 0) {
                        isAsyncAwait = true;
                    }

                    function assertWrapper() {
                        try {
                            assert.apply(global, arguments);
                        }
                        catch (err) {
                            if (aBeforeOrAfterEach.noFatal) {
                                //TODO
                            }
                            else {
                                throw err;
                            }
                        }
                    }

                    //TODO: need to implement all assert methods

                    function log() {
                        global._writeLog.apply(null, arguments);
                    }

                    const t = {
                        log: log,
                        data: test.data,
                        desc: String(test.desc),
                        testId: test.testId,
                        value: test.value,
                        assert: assertWrapper,
                        ctn: null,
                        done: null,
                        fatal: null
                    };


                    args.splice(0, 1, t);


                    if (isGeneratorFn) {
                        if (aBeforeOrAfterEach.cb) {
                            throw new Error('Generator function callback also asking for done param => inconsistent.');
                        }

                        handleGenerator(aBeforeOrAfterEach.fn, args, aBeforeOrAfterEach.ctx);
                    }
                    else if (aBeforeOrAfterEach.cb) {

                        t.done = function done(err) {
                            if (err) {
                                err.sumanFatal = global.sumanOpts.bail ? true : false;
                            }
                            fini(err);
                        };

                        t.ctn = function ctn() {
                            fini(null);   //TODO: use spread operator here?
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

                        //if (!sumanUtils.checkForValInStr(aBeforeOrAfterEach.toString(), /done/g)) {
                        //    throw aBeforeOrAfterEach.NO_DONE;
                        //}

                        aBeforeOrAfterEach.fn.apply(aBeforeOrAfterEach.ctx, args); //TODO: apply(null) is correct?

                    }
                    else {

                        handlePotentialPromise(aBeforeOrAfterEach.fn.apply(aBeforeOrAfterEach.ctx, args), false);
                    }

                });

            });

        }

    }

};