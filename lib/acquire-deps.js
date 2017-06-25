'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var _ = require('lodash');
var fnArgs = require('function-arguments');
var su = require('suman-utils');
var colors = require('colors/safe');
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
    var verbosity = _suman.sumanOpts.verbosity || 5;
    _suman.log('verbosity level => ', colors.magenta(verbosity));
    var getAllPromises = function (key, $deps) {
        if (cachedPromises[key]) {
            return cachedPromises[key];
        }
        if (verbosity > 3) {
            _suman.log(colors.cyan("(suman.once.pre.js) => Beginning to source dep with key => '" + key + "'"));
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
                if (v) {
                    if (typeof v !== 'string') {
                        throw new Error(' => There is a problem in your suman.once.pre.js file - ' +
                            'the following key was not a string => ' + util.inspect(v));
                    }
                    if (String(v).indexOf(':') > -1) {
                        props = props || [];
                        props.push(v);
                        return false;
                    }
                    return true;
                }
                else {
                    console.error(' => You have an empty key in your suman.once.pre.js file.');
                    console.error(' => Suman will continue optimistically.');
                    return false;
                }
            });
        }
        else {
            subDeps = [];
            fn = val;
        }
        if (!timeout || !Number.isInteger(timeout)) {
            timeout = 25000;
        }
        if (verbosity > 6) {
            _suman.log("Maximum time allocated to source dependency with key => '" + key + "' is => ", timeout);
        }
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
                Object.assign(acc, v);
            });
        })).then(function ($$vals) {
            if (verbosity > 5 && subDeps.length > 0) {
                _suman.log(colors.blue("suman.once.pre.js => "
                    + ("Finished sourcing the dependencies " + util.inspect(subDeps) + " of key => '" + key + "'")));
            }
            var to;
            return new Promise(function (resolve, reject) {
                to = setTimeout(function () {
                    reject(new Error("Suman dependency acquisition timed-out for dependency with key => '" + key + "'"));
                }, _suman.weAreDebugging ? 5000000 : timeout);
                if (verbosity > 5 || su.isSumanDebug()) {
                    _suman.log('suman.once.pre.js => Executing dep with key = "' + key + '"');
                }
                if (typeof fn !== 'function') {
                    reject({
                        key: key,
                        error: new Error(' => Suman usage error => would-be function was undefined or otherwise ' +
                            'not a function => ' + String(fn))
                    });
                }
                else if (fn.length > 1 && su.isGeneratorFn(fn)) {
                    reject({
                        key: key,
                        error: new Error(' => Suman usage error => function was a generator function but also took a callback' + String(fn))
                    });
                }
                else if (su.isGeneratorFn(fn)) {
                    var gen = makeGen(fn, null);
                    gen.call(null, acc).then(resolve, function (e) {
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
                    fn.call(null, acc, function (e, val) {
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
                if (verbosity > 3 || su.isSumanDebug()) {
                    _suman.log(colors.green.bold('suman.once.pre.js => Finished sourcing dep with key = "' + key + '"'));
                    console.log('\n');
                }
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
    return Promise.all(promises).then(function (deps) {
        var obj = deps.reduce(function (prev, curr) {
            return Object.assign(prev, curr);
        }, {});
        if (!_suman.processIsRunner) {
            _suman.log(colors.green.underline.bold('Finished with suman.once.pre.js dependencies.'));
            console.log('\n');
        }
        return customStringify(obj);
    }, function (err) {
        _suman.logError(colors.magenta('There was an error sourcing your dependencies in suman.once.pre.js.'));
        console.error(err.stack || err);
        return customStringify({});
    });
};
