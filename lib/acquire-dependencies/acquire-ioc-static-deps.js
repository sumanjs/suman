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
var ioc_static_injector_1 = require("../injection/ioc-static-injector");
var iocPromise = null;
var SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
var thisVal = {
    'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.'
};
exports.acquireIocStaticDeps = function () {
    if (iocPromise) {
        return iocPromise;
    }
    var ret, iocFnArgs, getiocFnDeps, iocStaticFn = _suman.iocStaticFn;
    try {
        assert.equal(typeof iocStaticFn, 'function', '<suman.ioc.static.js> must export a function.');
        iocFnArgs = fnArgs(iocStaticFn);
        getiocFnDeps = ioc_static_injector_1.makeIocStaticInjector();
        ret = iocStaticFn.apply(null, getiocFnDeps(iocFnArgs));
        ret = ret.dependencies || ret.deps;
        assert(suman_utils_1.default.isObject(ret), '`suman.ioc.static.js` must export a function which returns an object with a "dependencies" property.');
    }
    catch (err) {
        if (/Cannot find module/.test(String(err.message))) {
            _suman.log.error(err.message);
        }
        else {
            _suman.log.error(err.stack);
        }
        console.error();
        return iocPromise = Promise.resolve(_suman.$staticIoc = {});
    }
    var promises = Object.keys(ret).map(function (key) {
        var to;
        return new Promise(function (resolve, reject) {
            to = setTimeout(function () {
                reject("static dep acquisition (suman.static.ioc.js) timed out for key '" + key + "'");
            }, _suman.weAreDebugging ? 50000000 : 20000);
            var fn = ret[key];
            if (typeof fn !== 'function') {
                reject(new Error('Value in IOC object was not a function for corresponding key => ' +
                    '"' + key + '", actual value was => "' + util.inspect(fn) + '"'));
            }
            else if (fn.length > 1) {
                reject(new Error(chalk.red(' => Suman usage error => <suman.ioc.js> functions take 0 or 1 arguments, ' +
                    'with the optional single argument being a callback function.')));
            }
            else if (fn.length > 0) {
                var args = fnArgs(fn);
                var str = fn.toString();
                var matches = str.match(new RegExp(args[0], 'g')) || [];
                if (matches.length < 2) {
                    throw new Error('Callback in your function was not present => \n' + str);
                }
                fn.call(thisVal, function (err, val) {
                    err ? reject(err) : resolve(val);
                });
            }
            else {
                Promise.resolve(fn.call(thisVal)).then(resolve, reject);
            }
        })
            .then(function (v) {
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
        _suman.log.error(err.stack || err);
        _suman.log.error('despite the error, suman will continue optimistically.');
        return _suman.$staticIoc = {};
    });
};
