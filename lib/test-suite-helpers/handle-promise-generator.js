/**
 * Created by t_millal on 11/4/16.
 */


function async(makeGenerator, ctx) {

    return function () {

        const generator = makeGenerator.apply(ctx, arguments);

        function handle(result) {

            // result => { done: [Boolean], value: [Object] }
            if (result.done) {
                return Promise.resolve(result.value);
            }
            else {
                return Promise.resolve(result.value).then(function (res) {
                    return handle(generator.next(res));
                }, function (e) {
                    return handle(generator.throw(e));
                });
            }
        }

        try {
            return handle(generator.next());
        } catch (e) {
            return Promise.reject(e);
        }
    }
}


module.exports = {


    handlePotentialPromise: function handlePotentialPromise(done, str) {

        return function handle(val, warn) {

            if ((!val || (typeof val.then !== 'function')) && warn) {
                // global._writeTestError('\n => Suman warning: you may have forgotten to return a Promise => \n' + str + '\n');
            }

            Promise.resolve(val).then(function () {
                done(null);
            }, function (err) {
                done(err);
            });
        }
    },

    makeHandleGenerator: function makeHandleGenerator(done) {

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