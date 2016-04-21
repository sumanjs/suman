/**
 * Created by denman on 3/14/2016.
 */


//#project
const constants = require('../../config/suman-constants');

module.exports = {


    //TODO: need to remove allowFatal due to --bail option
    makeCallback: function makeCallback(d, test, timer, type, cb) {

        var called = -1;

        return function (err) {

            if (++called === 0) {

                try {

                    clearTimeout(timer);

                    if (err) {
                        
                        if (type === 'before/after' || type === 'beforeEach/afterEach' || global.sumanOpts.bail) {
                            err.sumanFatal = true; //note: fatal if it's in a before/after each
                        }

                        if (test) {
                            test.error = err;
                            if(type === 'test' && global.sumanOpts.bail){
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
                    //do nothing
                } finally {
                    cb(null, err);
                }
            }
            else {
                if(err){
                    console.error(err.stack || err);
                }

                //note: the following logic says: callback should only be fired more than once if it is due to a timeout
                //firing *before* done/pass/fail etc.; otherwise, we need to console.error the double callback
                //and possible fail the test, or add a warning

                if(called > 1 || !test.timedOut){
                    console.error(new Error('Warning: test callback requested twice').stack);
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
                console.error(err);
                done(err);
            });
        }
    },

    makeHandleGenerator: function makeHandleGenerator(done) {

        function async(makeGenerator) {

            return function () {

                var generator = makeGenerator.apply(makeGenerator.ctx, arguments);

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

            const gen = async(fn);

            gen.apply(ctx, args).then(function (val) {
                done();
            }, function (err) {
                done(err);
            });

        }
    }

};