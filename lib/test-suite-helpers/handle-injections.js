'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var t_proto_inject_1 = require("./t-proto-inject");
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
        var callable = true, timeoutVal = weAreDebugging ? 5000000 : inj.timeout;
        var to = setTimeout(function () {
            first(new Error("Injection hook timeout. " + ('For injection with name => ' + inj.desc)));
        }, timeoutVal);
        var first = function (err) {
            if (callable) {
                callable = false;
                clearTimeout(to);
                process.nextTick(cb, err);
            }
            else if (err) {
                _suman.log.error('Callback was called more than once, with the following error:');
                _suman.log.error(err.stack || err);
            }
        };
        var values = [];
        var assertCount = { num: 0 };
        return new Promise(function (resolve, reject) {
            var injParam = t_proto_inject_1.makeInjectObj(inj, assertCount, suite, values, reject, resolve);
            injParam.fatal = reject;
            if (inj.cb) {
                var d = function (err, results) {
                    if (err) {
                        return reject(err);
                    }
                    Promise.resolve(results).then(resolve, reject);
                };
                injParam.done = d;
                injParam.ctn = resolve;
                injParam.fail = reject;
                inj.fn.call(null, Object.setPrototypeOf(d, injParam));
            }
            else {
                Promise.resolve(inj.fn.call(null, injParam))
                    .then(function () {
                    return values.reduce(function (a, b) {
                        return Promise.resolve(b.val);
                    }, null);
                })
                    .then(resolve, reject);
            }
        })
            .then(function () {
            debugger;
            var p = values.reduce(function (a, b) {
                return Promise.resolve(b.val)
                    .then(function (v) {
                    return addValuesToSuiteInjections(b.k, v);
                });
            }, null);
            return p.then(function () {
                first(null);
            });
        })
            .catch(first);
    }, cb);
};
