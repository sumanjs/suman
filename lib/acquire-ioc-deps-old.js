'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var util = require('util');
var EE = require('events');
var colors = require('colors/safe');
var includes = require('lodash.includes');
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants').constants;
var iocEmitter = _suman.iocEmitter = (_suman.iocEmitter || new EE());
var iocContainer = _suman.iocContainer = (_suman.iocContainer || {});
var iocProgressContainer = _suman.iocProgressContainer = (_suman.iocProgressContainer || {});
iocEmitter.setMaxListeners(250);
module.exports = function acquireDepsOriginal(deps, suite, cb) {
    var obj = {};
    var SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
    if (suite.parent) {
        assert(!suite.isRootSuite, 'suman implementation error => we expect the root suite here. Please report.');
        return process.nextTick(cb, null, {});
    }
    deps.forEach(function (dep) {
        if (includes(constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in _suman.iocConfiguration) {
            console.log('Warning: you added a IoC dependency for "' + dep +
                '" but this is a reserved internal Suman dependency injection value.');
            throw new Error('Warning: you added a IoC dependency for "' + dep +
                '" but this is a reserved internal Suman dependency injection value.');
        }
        obj[dep] = _suman.iocConfiguration[dep];
        if (!obj[dep] && !includes(constants.CORE_MODULE_LIST, String(dep)) &&
            !includes(constants.SUMAN_HARD_LIST, String(dep))) {
            var deps_1 = Object.keys(_suman.iocConfiguration || {}).map(function (item) {
                return ' "' + item + '" ';
            });
            _suman._writeTestError(new Error('The following desired dependency is not in your suman.ioc.js file: "' + dep + '"\n' +
                ' => ...your available dependencies are: [' + deps_1 + ']').stack);
        }
    });
    var temp = Object.keys(obj).map(function (key) {
        var fn = obj[key];
        var cache = iocContainer[key];
        var inProgress = iocProgressContainer[key];
        return new Promise(function (resolve, reject) {
            if (!fn) {
                resolve();
            }
            else if (typeof fn !== 'function') {
                reject(new Error('Value in IOC object was not a function for corresponding key => ' +
                    '"' + key + '", value => "' + util.inspect(fn) + '"'));
            }
            else if (cache) {
                if (SUMAN_DEBUG) {
                    console.log('CACHE WAS USED for key = "' + key + '"');
                }
                assert(inProgress === 'done', 'iocProgressContainer should have "done" value for key = "' + key + '"');
                resolve(cache);
            }
            else if (inProgress === true) {
                if (SUMAN_DEBUG) {
                    console.log('IN PROGRESS WAS USED for key = "' + key + '".');
                }
                iocEmitter.once(key, resolve);
                iocEmitter.once('error', reject);
            }
            else if (fn.length > 1) {
                reject(new Error(colors.red(' => Suman usage error => suman.ioc.js functions take 0 or 1 arguments, with the single argument being a callback function.')));
            }
            else if (fn.length > 0) {
                var args = fnArgs(fn);
                var str = fn.toString();
                var matches = str.match(new RegExp(args[1], 'g')) || [];
                if (matches.length < 2) {
                    throw new Error('Callback in your function was not present => ' + str);
                }
                if (key in iocProgressContainer) {
                    throw new Error(' => Suman internal error => "' + key + '" should not already be in iocProgressContainer');
                }
                iocProgressContainer[key] = true;
                fn.call(global, function (err, val) {
                    if (err) {
                        iocEmitter.emit('error', err);
                        reject(err);
                    }
                    else {
                        iocProgressContainer[key] = 'done';
                        iocContainer[key] = val;
                        iocEmitter.emit(key, val);
                        resolve(val);
                    }
                });
            }
            else {
                if (key in iocProgressContainer) {
                    throw new Error(' => Suman internal error => "' + key + '" should not already be in iocProgressContainer');
                }
                iocProgressContainer[key] = true;
                Promise.resolve(fn.call(null)).then(function res(val) {
                    iocContainer[key] = val;
                    iocProgressContainer[key] = 'done';
                    iocEmitter.emit(key, val);
                    resolve(val);
                }, function rej(err) {
                    iocProgressContainer[key] = err;
                    iocEmitter.emit('error', err);
                    reject(err);
                });
            }
        });
    });
    Promise.all(temp).then(function (deps) {
        Object.keys(obj).forEach(function (key, index) {
            obj[key] = deps[index];
        });
        process.nextTick(cb, null, obj);
    }, function (err) {
        console.error(err.stack || err);
        process.nextTick(cb, err, {});
    });
};
