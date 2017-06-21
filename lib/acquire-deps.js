'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var _ = require('lodash');
var fnArgs = require('function-arguments');
var su = require('suman-utils');
var _suman = global.__suman = (global.__suman || {});
var makeGen = require('./helpers/async-gen');
var cachedPromises = {};
var customStringify = function (v) {
    var cache = [];
    return JSON.stringify(v, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    });
};
module.exports = function acquireDependencies(depList, depContainerObj) {
    var getAllPromises = function (key, $deps) {
        var c;
        if (c = cachedPromises[key]) {
            return c;
        }
        var val = depContainerObj[key];
        var subDeps;
        var fn;
        var timeout;
        var props;
        if (Array.isArray(val)) {
            fn = val[val.length - 1];
            val.pop();
            subDeps = val.filter(function (v) {
                if (String(v).indexOf(':') > -1) {
                    props = props || [];
                    props.push(v);
                    return false;
                }
                return true;
            });
        }
        else {
            subDeps = [];
            fn = val;
        }
        if (!timeout || !Number.isInteger(timeout)) {
            timeout = 25000;
        }
        console.log(' => Timeout is => ', timeout);
        $deps.forEach(function (d) {
            if (d === key) {
                throw new Error('Circular dependency => existing deps => ' + util.inspect($deps) + ', ' +
                    'new dep => "' + key + '"');
            }
        });
        $deps.push(key);
        subDeps.forEach(function (d) {
            if ($deps.includes(d)) {
                throw new Error(' => Direct circular dependency => pre-existing deps => ' + util.inspect($deps) + ', ' +
                    'newly required dep => "' + d + '"');
            }
        });
        var acc = {};
        return cachedPromises[key] = Promise.all(subDeps.map(function (k) {
            return getAllPromises(k, $deps.slice(0)).then(function (v) {
                acc[k] = v;
            });
        })).then(function ($$vals) {
            var to;
            return new Promise(function (resolve, reject) {
                to = setTimeout(function () {
                    reject(new Error('Suman dependency acquisition timed-out for dependency with key/id="' + key + '"'));
                }, _suman.weAreDebugging ? 5000000 : timeout);
                if (_suman.sumanOpts.verbose || su.isSumanDebug()) {
                    console.log(' => Executing dep with key = "' + key + '"');
                }
                if (typeof fn !== 'function') {
                    reject({
                        key: key,
                        error: new Error(' => Suman usage error => would-be function was undefined or otherwise ' +
                            'not a function => ' + String(fn))
                    });
                }
                else if (fn.length > 1 && su.isGeneratorFn(fn)) {
                    reject(new Error(' => Suman usage error => function was a generator function but also took a callback' + String(fn)));
                }
                else if (su.isGeneratorFn(fn)) {
                    var gen = makeGen(fn, null);
                    gen.call(undefined, acc).then(resolve, function (e) {
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
                            error: new Error(' => Suman usage error => Callback in your function was not present => ' + str)
                        });
                    }
                    fn.call(undefined, acc, function (e, val) {
                        e ? reject({
                            key: key,
                            error: e
                        }) : resolve(val);
                    });
                }
                else {
                    Promise.resolve(fn.call(undefined, acc)).then(resolve, function (e) {
                        reject({
                            key: key,
                            error: e
                        });
                    });
                }
            }).then(function (val) {
                clearTimeout(to);
                return _a = {},
                    _a[key] = val,
                    _a;
                var _a;
            }, function (err) {
                clearTimeout(to);
                return Promise.reject(err);
            });
        });
    };
    var promises = depList.map(function (key) {
        return getAllPromises(key, []);
    });
    return Promise.all(_.flattenDeep(promises)).then(function (deps) {
        return customStringify(deps);
    });
};
