/**
 * Created by t_millal on 10/11/16.
 */

//core
const domain = require('domain');
const assert = require('assert');
const util = require('util');


//npm
const sumanUtils = require('suman-utils/utils');

//project


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


module.exports = function callbackOrPromise(key, hash, cb) {

    const d = domain.create();

    var called = false;

    function first() {
        if (!called) {
            called = true;
            const args = arguments;
            process.nextTick(function () {
                cb.apply(null, args);
            });
        }
        else {
            console.log.apply(console, arguments);
        }
    }

    d.once('error', function (err) {
        console.log(err.stack || err);
        first(err);
    });

    d.run(function () {
        process.nextTick(function () {
            const fn = hash[key];

            assert(typeof fn === 'function', 'Integrant listing is not a function => ' + key,
                '\n\n => instead we have => \n\n', util.inspect(fn));

            const isGeneratorFn = sumanUtils.isGeneratorFn(fn);

            if (fn.length > 0) {

                var justInCase = function (err, val) {
                    err ? first(err) : first(null, val);
                };

                fn.apply(global, [justInCase]);
            }
            else if (isGeneratorFn) {

                const gen = async(fn, global);
                gen.apply(global, []).then(function (val) {
                    first(null, val);
                }, first);
            }
            else {
                Promise.resolve(fn.apply(global, [])).then(function (val) {
                    //TODO: we could send val to indvidual tests, in the form of JSON
                    first(null, val);

                }, first);
            }
        });
    });

}