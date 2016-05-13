/**
 * Created by denman on 3/14/2016.
 */


//#project
const constants = require('../../config/suman-constants');

module.exports = {


    //TODO: need to remove allowFatal due to --bail option
    //TODO: this is used not just for tests but for hooks, so need to pass hook name if it exists
    makeCallback: function makeCallback(d, assertCount, test, hook, timerObj, type, cb) {

        var called = -1;

        return function (err, isTimeout) {

            err ? err.isTimeoutErr = isTimeout || false : null;  //TODO: need to make timeout error distinguishable for hooks or test

            if (++called === 0) {

                try {

                    clearTimeout(timerObj.timer);

                    if (test && test.plan && assertCount && test.plan !== assertCount.num) {
                        test.errorPlanCount = 'plan count was ' + test.plan + ' but actual assertion count was ' + assertCount.num;
                    }

                    if (test && test.errorPlanCount) {
                        console.error('test error plan count:' + test.errorPlanCount);
                    }

                    if (err) {

                        //TODO: can probably change check for type into simply a check for hook == null and test == null
                        if (type === 'before/after' || type === 'beforeEach/afterEach' || global.sumanOpts.bail) {
                            err.sumanFatal = true; //note: fatal if it's in a before/after each
                        }

                        if (test) {
                            test.error = err;
                            if (type === 'test' && global.sumanOpts.bail) {
                                test.error.sumanExitCode = constants.EXIT_CODES.TEST_ERROR_AND_BAIL_IS_TRUE
                            }
                        }
                    }
                    else {
                        if (test) {
                            test.complete = true;
                            test.dateComplete = Date.now();
                        }
                    }

                    // d.exit(); //TODO: this removed to allow for errors thrown *after* tests/hooks are called-back

                } catch (err) {
                    console.error(err.stack);
                } finally {
                    cb(null, err);
                }
            }
            else {

                if (err) {
                    global._writeTestError(err.stack || err);
                }

                //note: the following logic says: callback should only be fired more than once if it is due to a timeout
                //firing *before* done/pass/fail etc.; otherwise, we need to console.error the double callback
                //and possible fail the test, or add a warning
                if (called > 1 || (test && !test.timedOut)) {
                    global._writeTestError('\n\nWarning: the following test callback was invoked twice by your code for the following test => ' + test.desc + '\n\n');
                }
                else if (called > 1 && hook) {  //TODO need to handle this case for hooks
                    global._writeTestError('\n\nWarning: the following test callback was invoked twice by your code for the following hook => ' + (hook.desc || '(hook has no description)') + '\n\n');
                }

            }

        }

    },

    makeTestInjection: function (test, self, cb) {

        //note: cb is the done

        return {

            log: self.log,
            data: test.data,
            desc: String(test.desc),
            testId: test.testId

        }

    },

    handlePotentialPromise: function handlePotentialPromise(done) {

        return function handle(val, warn) {

            if ((!val || (typeof val.then !== 'function')) && warn) {
                process.stdout.write('\nSuman warning: you may have forgotten to return a Promise.\n');
            }

            Promise.resolve(val).then(function () {
                done(null);
            }, function (err) {
                done(err);
            });
        }
    },

    makeHandleGenerator: function makeHandleGenerator(done) {

        function async(makeGenerator, ctx) {

            return function () {

                var generator = makeGenerator.apply(ctx, arguments);

                function handle(result) {
                    // result => { done: [Boolean], value: [Object] }

                    if (result.done) {
                        return Promise.resolve(result.value);
                    }
                    else {
                        return Promise.resolve(result.value).then(function (res) {
                            return handle(generator.next(res));
                        }, function (err) {
                            return handle(generator.throw(err));
                        });
                    }
                }

                try {
                    return handle(generator.next());
                } catch (err) {
                    return Promise.reject(err);
                }
            }
        }

        return function (fn, args, ctx) {

            const gen = async(fn, ctx);

            gen.apply(ctx, args).then(function (val) {
                done();
            }, function (err) {
                done(err);
            });

        }
    }

};