'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var async = require("async");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var t_proto_1 = require("./t-proto");
var suman_constants_1 = require("../../config/suman-constants");
var weAreDebugging = su.weAreDebugging;
exports.handleInjections = function (suite, cb) {
    var addValuesToSuiteInjections = function (k, val) {
        if (k in suite.injectedValues) {
            throw new Error(" => Injection value '" + k + "' was used more than once; this value needs to be unique.");
        }
        Object.defineProperty(suite.injectedValues, k, {
            enumerable: true,
            writable: false,
            configurable: true,
            value: val
        });
    };
    var isDescValid = function (desc) {
        return desc && String(desc) !== String(suman_constants_1.constants.UNKNOWN_INJECT_HOOK_NAME);
    };
    var injections = suite.getInjections();
    async.eachSeries(injections, function (inj, cb) {
        var callable = true;
        var to = setTimeout(function () {
            first(new Error("Injection hook timeout. " + ('For injection with name => ' + inj.desc)));
        }, weAreDebugging ? 5000000 : inj.timeout);
        var first = function (err) {
            if (callable) {
                callable = false;
                clearTimeout(to);
                process.nextTick(cb, err);
            }
            else if (err) {
                _suman.log.error('Callback was called more than once, with error => \n', err.stack || err);
            }
        };
        var injParam = Object.create(t_proto_1.tProto);
        var valuesMap = {};
        return new Promise(function (resolve, reject) {
            injParam.registerKey = injParam.register = function (k, val) {
                assert(k && typeof k === 'string', 'key must be a string.');
                {
                    if (k in valuesMap) {
                        throw new Error("Injection key '" + k + "' has already been added.");
                    }
                    if (k in suite.injectedValues) {
                        throw new Error("Injection key '" + k + "' has already been added.");
                    }
                }
                return Promise.resolve(valuesMap[k] = val);
            };
            injParam.registerFnsMap = injParam.registerFnMap = function (o) {
                return new Promise(function (resolve, reject) {
                    async.series(o, function (err, results) {
                        console.log('err => ', err);
                        console.log('results => ', results);
                        if (err)
                            return reject(err);
                        {
                            Object.keys(results).forEach(function (k) {
                                if (k in valuesMap) {
                                    return reject(new Error("Injection key '" + k + "' has already been added."));
                                }
                                if (k in suite.injectedValues) {
                                    return reject(new Error("Injection key '" + k + "' has already been added."));
                                }
                                return valuesMap[k] = results[k];
                            });
                        }
                        resolve(results);
                    });
                })
                    .catch(reject);
            };
            injParam.registerMap = injParam.registerPromisesMap = function (o) {
                var keys = Object.keys(o);
                return Promise.all(keys.map(function (k) {
                    {
                        if (k in valuesMap) {
                            throw new Error("Injection key '" + k + "' has already been added.");
                        }
                        if (k in suite.injectedValues) {
                            throw new Error("Injection key '" + k + "' has already been added.");
                        }
                    }
                    return valuesMap[k] = o[k];
                }));
            };
            if (inj.cb) {
                var d = function (err, results) {
                    if (err) {
                        return reject(err);
                    }
                    Promise.resolve(results).then(resolve, reject);
                };
                inj.fn.call(null, Object.setPrototypeOf(d, injParam));
            }
            else {
                Promise.resolve(inj.fn.call(null, injParam)).then(resolve, reject);
            }
        })
            .then(function () {
            var keys = Object.keys(valuesMap);
            return Promise.all(keys.map(function (k) {
                return valuesMap[k];
            }))
                .then(function (values) {
                keys.forEach(function (k, i) {
                    addValuesToSuiteInjections(k, values[i]);
                });
                first(null);
            });
        })
            .catch(first);
    }, cb);
};
