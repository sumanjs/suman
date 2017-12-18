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
    v.__handle = handleError;
    v.__fini = fini;
    v.registerKey = v.register = function (k, val) {
        try {
            assert(k && typeof k === 'string', 'key must be a string.');
        }
        catch (err) {
            return this.__handle(err);
        }
        if (k in valuesMap) {
            return this.__handle(new Error("Injection key '" + k + "' has already been added."));
        }
        if (k in suite.injectedValues) {
            return this.__handle(new Error("Injection key '" + k + "' has already been added."));
        }
        valuesMap[k] = true;
        values.push({ k: k, val: val });
        return Promise.resolve(val);
    };
    v.registerFnsMap = v.registerFnMap = function (o) {
        var self = this;
        return new Promise(function (resolve, reject) {
            assert(su.isObject(o), 'value must be a non-array object.');
            async.series(o, function (err, results) {
                if (err) {
                    return reject(err);
                }
                try {
                    Object.keys(results).forEach(function (k) {
                        if (k in valuesMap) {
                            throw new Error("Injection key '" + k + "' has already been added.");
                        }
                        if (k in suite.injectedValues) {
                            throw new Error("Injection key '" + k + "' has already been added.");
                        }
                        valuesMap[k] = true;
                        values.push({ k: k, val: results[k] });
                    });
                }
                catch (err) {
                    return reject(err);
                }
                resolve(results);
            });
        })
            .catch(function (err) {
            return self.__handle(err);
        });
    };
    v.registerMap = v.registerPromisesMap = function (o) {
        var keys = Object.keys(o);
        var self = this;
        var registry;
        try {
            registry = keys.map(function (k) {
                if (k in valuesMap) {
                    throw new Error("Injection key '" + k + "' has already been added.");
                }
                if (k in suite.injectedValues) {
                    throw new Error("Injection key '" + k + "' has already been added.");
                }
                valuesMap[k] = true;
                values.push({ k: k, val: o[k] });
                return o[k];
            });
        }
        catch (err) {
            return self.__handle(err);
        }
        return Promise.all(registry)
            .catch(function (err) {
            return self.__handle(err);
        });
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
        try {
            assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
        }
        catch (err) {
            return this.__handle(err);
        }
        inject.planCountExpected = v.planCountExpected = num;
    };
    v.confirm = function () {
        assertCount.num++;
    };
    return v;
};
