'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var chalk = require("chalk");
var includes = require('lodash.includes');
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var suman_constants_1 = require("../../config/suman-constants");
var iocPromiseContainer = {};
var thisVal = { 'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.' };
exports.acquireIocDeps = function (deps, suite, cb) {
    var obj = {};
    var SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
    deps.forEach(function (dep) {
        if (includes(suman_constants_1.constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in _suman.iocConfiguration) {
            throw new Error('Warning: you added a IoC dependency for "' + dep +
                '" but this is a reserved internal Suman dependency injection value.');
        }
        obj[dep] = undefined;
    });
    var promises = Object.keys(obj).map(function (key) {
        if (iocPromiseContainer[key]) {
            return iocPromiseContainer[key];
        }
        return iocPromiseContainer[key] = new Promise(function (resolve, reject) {
            var fn = obj[key];
            if (fn === '[suman reserved - no ioc match]') {
                resolve();
            }
            else if (typeof fn !== 'function') {
                reject(new Error('Value in IOC object was not a function for corresponding key => ' +
                    '"' + key + '", value => "' + util.inspect(fn) + '"'));
            }
            else if (fn.length > 1) {
                reject(new Error(chalk.red(' => Suman usage error => suman.ioc.js functions take 0 or 1 arguments, ' +
                    'with the single argument being a callback function.')));
            }
            else if (fn.length > 0) {
                var args = fnArgs(fn);
                var str = fn.toString();
                var matches = str.match(new RegExp(args[1], 'g')) || [];
                if (matches.length < 2) {
                    throw new Error('Callback in your function was not present => ' + str);
                }
                fn.call(thisVal, function (err, val) {
                    err ? reject(err) : resolve(val);
                });
            }
            else {
                Promise.resolve(fn.call(thisVal)).then(resolve, reject);
            }
        });
    });
    Promise.all(promises).then(function (deps) {
        Object.keys(obj).forEach(function (key, index) {
            obj[key] = deps[index];
        });
        process.domain && process.domain.exit();
        process.nextTick(cb, null, obj);
    }, function (err) {
        _suman.log.error('Error acquiring pre/integrant dependency:', err.stack || err);
        process.domain && process.domain.exit();
        process.nextTick(cb, err, {});
    });
};
