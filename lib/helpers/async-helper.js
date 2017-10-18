'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var su = require("suman-utils");
var fnArgs = require('function-arguments');
var async_gen_1 = require("./async-gen");
exports.asyncHelper = function (key, resolve, reject, $args, ln, fn) {
    if (typeof fn !== 'function') {
        var e = new Error('Suman usage error: would-be function was undefined or otherwise not a function =>\n' + String(fn));
        reject({ key: key, error: e });
    }
    else if (fn.length > 1 && su.isGeneratorFn(fn)) {
        var e = new Error('Suman usage error: function was a generator function but also took a callback =>\n' + String(fn));
        reject({ key: key, error: e });
    }
    else if (su.isGeneratorFn(fn)) {
        var gen = async_gen_1.makeRunGenerator(fn, null);
        gen.apply(null, $args).then(resolve, function (e) {
            reject({ key: key, error: e });
        });
    }
    else if (fn.length > 1) {
        var args = fnArgs(fn);
        var str = fn.toString();
        var matches = str.match(new RegExp(args[1], 'g')) || [];
        if (matches.length < 2) {
            var e = new Error('Suman usage error => Callback in your function was not present => ' + str);
            return reject({ key: key, error: e });
        }
        $args.push(function (e, val) {
            e ? reject({ key: key, error: e }) : resolve(val);
        });
        fn.apply(null, $args);
    }
    else {
        Promise.resolve(fn.apply(null, $args))
            .then(resolve, function (e) {
            reject({ key: key, error: e });
        });
    }
};
