'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var async = require('async');
var _suman = global.__suman = (global.__suman || {});
var freeze = require('./freeze-existing');
var weAreDebugging = require('./helpers/we-are-debugging');
module.exports = function (suite, cb) {
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
    async.eachSeries(injections, function (inj, cb) {
        var callable = true;
        var to = setTimeout(function () {
            first(new Error(' => Injection hook timeout.'));
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
            inj.fn.call(suite, function (err, results) {
                if (err) {
                    return first(err);
                }
                var p = Promise.resolve(results);
                p.then(function (ret) {
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
            });
        }
        else {
            var p = Promise.resolve(inj.fn.call(suite));
            p.then(function (ret) {
                if (inj.desc) {
                    addValuesToSuiteInjections(inj.desc, freeze(ret));
                    first(undefined);
                }
                else {
                    if (typeof ret !== 'object') {
                        throw new Error('Must return an object with keys, if no inject hook name is provided.');
                    }
                    if (Array.isArray(ret)) {
                        throw new Error('Must return an object with named keys, if no inject hook name is provided.');
                    }
                    var keys_1 = Object.keys(ret);
                    if (!keys_1.length) {
                        throw new Error('Injection hook was unnamed, but also resolved to object with no keys,\nso no name could' +
                            'be extracted for injection. Unfortunately this becomes fatal.');
                    }
                    var potentialPromises = keys_1.map(function (k) {
                        return ret[k];
                    });
                    Promise.all(potentialPromises).then(function (vals) {
                        keys_1.forEach(function (k, index) {
                            addValuesToSuiteInjections(k, freeze(vals[index]));
                        });
                        first(undefined);
                    }, first);
                }
            }, first);
        }
    }, cb);
};
