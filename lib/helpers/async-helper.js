"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var suman_utils_1 = require("suman-utils");
var fnArgs = require('function-arguments');
var makeGen = require('./async-gen');
exports.asyncHelper = function (key, resolve, reject, $args, ln, fn) {
    if (typeof fn !== 'function') {
        reject({
            key: key,
            error: new Error(' => Suman usage error => would-be function was undefined or otherwise ' +
                'not a function => ' + String(fn))
        });
    }
    else if (fn.length > 1 && suman_utils_1.default.isGeneratorFn(fn)) {
        reject({
            key: key,
            error: new Error('Suman usage error => function was a generator function but also took a callback =>\n' + String(fn))
        });
    }
    else if (suman_utils_1.default.isGeneratorFn(fn)) {
        var gen = makeGen(fn, null);
        gen.apply(null, $args).then(resolve, function (e) {
            reject({
                key: key,
                error: e
            });
        });
    }
    else if (fn.length > 1) {
        var args = fnArgs(fn);
        var str = fn.toString();
        var matches = str.match(new RegExp(args[1], 'g')) || [];
        if (matches.length < 2) {
            return reject({
                key: key,
                error: new Error('Suman usage error => Callback in your function was not present => ' + str)
            });
        }
        $args.push(function (e, val) {
            if (e) {
                reject({
                    key: key,
                    error: e
                });
            }
            else {
                resolve(val);
            }
        });
        fn.apply(null, $args);
    }
    else {
        Promise.resolve(fn.apply(null, $args))
            .then(resolve, function (e) {
            reject({
                key: key,
                error: e
            });
        });
    }
};
