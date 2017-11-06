'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var freeze_existing_props_1 = require("freeze-existing-props");
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
    async.each(injections, function (inj, cb) {
        var callable = true;
        var to = setTimeout(function () {
            first(new Error(" => Injection hook timeout. " + (inj.desc && 'For injection with name => ' + inj.desc)));
        }, weAreDebugging ? 5000000 : inj.timeout);
        var first = function (err) {
            if (callable) {
                callable = false;
                clearTimeout(to);
                process.nextTick(cb, err);
            }
            else if (err) {
                console.error(' => Callback was called more than once, with error => \n', err.stack || err);
            }
        };
        if (inj.cb) {
            var d = function (err, results) {
                if (err) {
                    return first(err);
                }
                Promise.resolve(results).then(function (ret) {
                    if (isDescValid(inj.desc)) {
                        addValuesToSuiteInjections(String(inj.desc), ret);
                    }
                    else {
                        Object.keys(ret).forEach(function (k) {
                            addValuesToSuiteInjections(String(k), freeze_existing_props_1.freezeExistingProps(ret[k]));
                        });
                    }
                    first(undefined);
                }, first);
            };
            inj.fn.call(suite, Object.setPrototypeOf(d, t_proto_1.tProto));
        }
        else {
            Promise.resolve(inj.fn.call(suite)).then(function (ret) {
                if (isDescValid(inj.desc)) {
                    addValuesToSuiteInjections(inj.desc, freeze_existing_props_1.freezeExistingProps(ret));
                    return first(undefined);
                }
                if (typeof ret !== 'object') {
                    throw new Error('Must return an object with keys, if no inject hook name is provided.');
                }
                if (Array.isArray(ret)) {
                    throw new Error('Must return an object with named keys, if no inject hook name is provided.');
                }
                var keys = Object.keys(ret);
                if (!keys.length) {
                    throw new Error('Injection hook was unnamed, but also resolved to object with no keys,\nso no name could' +
                        'be extracted for injection. Unfortunately this becomes fatal.');
                }
                var potentialPromises = keys.map(function (k) {
                    return ret[k];
                });
                Promise.all(potentialPromises).then(function (vals) {
                    keys.forEach(function (k, index) {
                        addValuesToSuiteInjections(String(k), freeze_existing_props_1.freezeExistingProps(vals[index]));
                    });
                    first(undefined);
                }, first);
            }, first);
        }
    }, cb);
};
