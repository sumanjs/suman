/**
 * Created by denman on 3/14/2016.
 */



module.exports = {

    makeCallback: function makeCallback(d, timer, allowFatal, cb) {

        var called = false;

        return function (err) {

            if (!called) {
                called = true;

                try {
                    if (err) {
                        if (allowFatal) {
                            err.sumanFatal = true; //note: fatal if it's in a before/after each
                        }
                    }
                    clearTimeout(timer);
                    d.exit();
                } catch (err) {
                    //do nothing
                } finally {
                    cb(null, err);
                }
            }

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
                done(err);
            });
        }
    }


}