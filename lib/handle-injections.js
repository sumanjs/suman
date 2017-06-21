'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var async = require('async');
var _suman = global.__suman = (global.__suman || {});
var tProto = require('./t-proto');
var freeze = require('./freeze-existing');
var weAreDebugging = require('./helpers/we-are-debugging');
exports.handleInjections = function (suite, cb) {
    function addValuesToSuiteInjections(k, val) {
        if (k in suite.injectedValues) {
            throw new Error(' => Injection value ' + k + ' was used more than once;' +
                ' this value needs to be unique.');
        }
        else {
            suite.injectedValues[k] = val;
        }
    }
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
                    if (inj.desc) {
                        addValuesToSuiteInjections(inj.desc, ret);
                    }
                    else {
                        Object.keys(ret).forEach(function (k) {
                            addValuesToSuiteInjections(k, freeze(ret[k]));
                        });
                    }
                    first(undefined);
                }, first);
            };
            inj.fn.call(suite, Object.setPrototypeOf(d, tProto));
        }
        else {
            Promise.resolve(inj.fn.call(suite)).then(function (ret) {
                if (inj.desc) {
                    addValuesToSuiteInjections(inj.desc, freeze(ret));
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
                        addValuesToSuiteInjections(k, freeze(vals[index]));
                    });
                    first(undefined);
                }, first);
            }, first);
        }
    }, cb);
};
var $exports = module.exports;
exports.default = $exports;
