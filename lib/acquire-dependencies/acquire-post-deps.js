'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var _ = require('lodash');
var fnArgs = require('function-arguments');
var suman_utils_1 = require("suman-utils");
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var async_helper_1 = require("../helpers/async-helper");
var extract_vals_1 = require("./helpers/extract-vals");
var cachedPromises = {};
exports.acquirePostDeps = function ($depList, depContainerObj) {
    var depList = _.flattenDeep([$depList]);
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
        var _a = extract_vals_1.extractVals(val), subDeps = _a.subDeps, fn = _a.fn, timeout = _a.timeout, props = _a.props;
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
                if (verbosity > 5 || suman_utils_1.default.isSumanDebug()) {
                    _suman.log('suman.once.pre.js => Executing dep with key = "' + key + '"');
                }
                async_helper_1.asyncHelper(key, resolve, reject, [acc], 1, fn);
            })
                .then(function (val) {
                clearTimeout(to);
                if (verbosity > 3 || suman_utils_1.default.isSumanDebug()) {
                    _suman.log(colors.green.bold('suman.once.pre.js => Finished sourcing dep with key = "' + key + '"'));
                    console.log('\n');
                }
                _suman.integrantHashKeyVals[key] = val;
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
        return obj;
    }, function (err) {
        _suman.logError(colors.magenta('There was an error sourcing your dependencies in suman.once.pre.js.'));
        _suman.logError(err.stack || err);
        return {};
    });
};
