'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var assert = require("assert");
var util = require("util");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var makeGen = require('./helpers/async-gen');
module.exports = function callbackOrPromise(key, hash, cb) {
    var d = domain.create();
    var called = false;
    function first() {
        if (!called) {
            called = true;
            d.exit();
            var args_1 = Array.from(arguments);
            process.nextTick(function () {
                cb.apply(null, args_1);
            });
        }
        else {
            console.error.apply(console, arguments);
        }
    }
    d.once('error', function (err) {
        console.log(err.stack || err);
        first(err);
    });
    d.run(function () {
        process.nextTick(function () {
            var fn = hash[key];
            assert(typeof fn === 'function', 'Integrant listing is not a function => ' + key, '\n\n => instead we have => \n\n', util.inspect(fn));
            var isGeneratorFn = su.isGeneratorFn(fn);
            if (isGeneratorFn && fn.length > 0) {
                first(new Error(' => Suman usage error, you have requested a callback to a generator function => \n' + fn.toString()));
            }
            else if (isGeneratorFn) {
                var gen = makeGen(fn, null);
                gen.call(null).then(function (val) {
                    first(null, val);
                }, first);
            }
            else if (fn.length > 0) {
                fn.call(null, first);
            }
            else {
                Promise.resolve(fn.call(null)).then(function (val) {
                    first(null, val);
                }, first);
            }
        });
    });
};
