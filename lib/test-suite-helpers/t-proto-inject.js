'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var chai = require('chai');
var chaiAssert = chai.assert;
var su = require("suman-utils");
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var t_proto_1 = require("./t-proto");
var badProps = {
    inspect: true,
    constructor: true
};
exports.makeInjectObj = function (inject, assertCount, suite, values, handleError, fini) {
    var planCalled = false;
    var v = Object.create(t_proto_1.tProto);
    var valuesMap = {};
    v.__hook = inject;
    v.__handle = v.__handleErr = handleError;
    v.__fini = fini;
    v.registerKey = v.register = function (k, val) {
        assert(k && typeof k === 'string', 'key must be a string.');
        if (k in valuesMap) {
            throw new Error("Injection key '" + k + "' has already been added.");
        }
        if (k in suite.injectedValues) {
            throw new Error("Injection key '" + k + "' has already been added.");
        }
        valuesMap[k] = true;
        values.push({ k: k, val: val });
        return Promise.resolve(val);
    };
    v.registerFnsMap = v.registerFnMap = function (o) {
        assert(su.isObject(o), 'value must be a non-array object.');
        return new Promise(function (resolve, reject) {
            async.series(o, function (err, results) {
                console.log('err => ', err);
                console.log('results => ', results);
                if (err) {
                    return reject(err);
                }
                Object.keys(results).forEach(function (k) {
                    if (k in valuesMap) {
                        return reject(new Error("Injection key '" + k + "' has already been added."));
                    }
                    if (k in suite.injectedValues) {
                        return reject(new Error("Injection key '" + k + "' has already been added."));
                    }
                    valuesMap[k] = true;
                    values.push({ k: k, val: results[k] });
                });
                resolve(results);
            });
        });
    };
    v.registerMap = v.registerPromisesMap = function (o) {
        var keys = Object.keys(o);
        return Promise.all(keys.map(function (k) {
            if (k in valuesMap) {
                throw new Error("Injection key '" + k + "' has already been added.");
            }
            if (k in suite.injectedValues) {
                throw new Error("Injection key '" + k + "' has already been added.");
            }
            valuesMap[k] = true;
            values.push({ k: k, val: o[k] });
            return o[k];
        }));
    };
    v.plan = function (num) {
        if (planCalled) {
            _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
            return;
        }
        planCalled = true;
        if (inject.planCountExpected !== undefined) {
            _suman.writeTestError(new Error(' => Suman warning => plan() called, even though plan was already passed as an option.').stack);
        }
        assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
        inject.planCountExpected = v.planCountExpected = num;
    };
    v.confirm = function () {
        assertCount.num++;
    };
    return v;
};
