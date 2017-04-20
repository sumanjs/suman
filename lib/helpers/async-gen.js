'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
module.exports = function async(makeGenerator, ctx) {
    return function () {
        var generator = makeGenerator.apply(ctx, arguments);
        function handle(result) {
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
        }
        catch (e) {
            return Promise.reject(e);
        }
    };
};
