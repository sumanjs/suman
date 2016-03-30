/**
 * Created by denman on 3/14/2016.
 */



module.exports = {

    makeCallback: function makeCallback(d, test, timer, allowFatal, cb) {

        var called = false;

        return function (err) {

            if (!called) {
                called = true;

                try {

                    clearTimeout(timer);

                    if (err) {
                        if (allowFatal) {
                            err.sumanFatal = true; //note: fatal if it's in a before/after each
                        }
                        test.error = err.stack;
                    }
                    else {
                        test.complete = true;
                    }

                    // d.exit(); //TODO: this removed to allow for errors thrown *after* tests/hooks are called-back

                } catch (err) {
                    //do nothing
                } finally {
                    cb(null, err);
                }
            }
            else {
                console.error(new Error('Warning: test callback requested twice').stack);
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
            }).catch(function (err) {
                console.error(err);
                done(err);
            });
        }
    },

    makeHandleGenerator: function makeHandleGenerator(done) {

        function async(makeGenerator) {

            return function () {

                var generator = makeGenerator.apply(this, arguments);

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