'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var chalk = require("chalk");
var suman_utils_1 = require("suman-utils");
var includes = require('lodash.includes');
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var iocPromise = null;
var SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
var thisVal = { 'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.' };
exports.acquireIocStaticDeps = function () {
    if (iocPromise) {
        return iocPromise;
    }
    var ret, iocStaticFn;
    try {
        iocStaticFn = require(_suman.sumanHelperDirRoot + '/suman.ioc.static.js');
        iocStaticFn = iocStaticFn.default || iocStaticFn;
        assert.equal(typeof iocStaticFn, 'function', '`suman.ioc.static.js` must export a function.');
        ret = iocStaticFn.apply(null, []);
        ret = ret.dependencies || ret.deps;
        assert(suman_utils_1.default.isObject(ret), '`suman.ioc.static.js` must export a function which returns an object with a "dependencies" property.');
    }
    catch (err) {
        if (/Cannot find module/.test(String(err.message))) {
            _suman.logError(err.message);
        }
        else {
            _suman.logError(err.stack || err);
        }
        console.error('');
        _suman.logError('despite the error, suman will continue optimistically.');
        return Promise.resolve(_suman.$staticIoc = {});
    }
    var promises = Object.keys(ret).map(function (key) {
        var to;
        return new Promise(function (resolve, reject) {
            to = setTimeout(function () {
                reject("static dep acquisition (suman.static.ioc.js) timed out for key '" + key + "'");
            }, 5000);
            var fn = ret[key];
            if (typeof fn !== 'function') {
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
        }).then(function (v) {
            clearTimeout(to);
            return v;
        });
    });
    return iocPromise = Promise.all(promises).then(function (deps) {
        var final = {};
        Object.keys(ret).forEach(function (key, index) {
            final[key] = deps[index];
        });
        return _suman.$staticIoc = final;
    }, function (err) {
        _suman.logError(err.stack || err);
        _suman.logError('despite the error, suman will continue optimistically.');
        return _suman.$staticIoc = {};
    });
};
