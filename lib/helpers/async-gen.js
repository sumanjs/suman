'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
exports.makeRunGenerator = function (fn, ctx) {
    return function () {
        var generator = fn.apply(ctx, arguments);
        var handle = function (result) {
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
        };
        try {
            return handle(generator.next());
        }
        catch (e) {
            return Promise.reject(e);
        }
    };
};
