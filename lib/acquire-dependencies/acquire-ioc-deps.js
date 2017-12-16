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
var ioc_injector_1 = require("../injection/ioc-injector");
var general_1 = require("../helpers/general");
var IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
var noKeyExistsPlaceholder = '[suman reserved - no ioc match]';
var thisVal = { 'message': "Suman users: don't use \"this\" here, instead => http://sumanjs.org/patterns." };
exports.acquireIocDeps = function (suman, iocDepNames, suite, obj, cb) {
    var iocPromiseContainer = suman.iocPromiseContainer;
    var dependencies = null;
    try {
        var sumanPaths = general_1.resolveSharedDirs(_suman.sumanConfig, _suman.projectRoot, _suman.sumanOpts);
        var iocFn = general_1.loadSharedObjects(sumanPaths, _suman.projectRoot, _suman.sumanOpts).iocFn;
        var iocFnArgs = fnArgs(iocFn);
        var getiocFnDeps = ioc_injector_1.makeIocInjector(suman.iocData, null, null);
        var iocFnDeps = getiocFnDeps(iocFnArgs);
        var iocRet = iocFn.apply(null, iocFnDeps);
        assert(suman_utils_1.default.isObject(iocRet.dependencies), ' => suman.ioc.js must export a function which returns an object with a dependencies property.');
        dependencies = iocRet.dependencies;
    }
    catch (err) {
        _suman.log.error(err.stack || err);
        _suman.log.error('despite the error, suman will continue optimistically.');
        dependencies = {};
    }
    iocDepNames.forEach(function (dep) {
        if (dep in dependencies) {
            var d = obj[dep] = dependencies[dep];
            if (!d) {
                var deps = Object.keys(dependencies || {}).map(function (item) {
                    return ' "' + item + '" ';
                });
                _suman.writeTestError("Warning: the following desired dependency is not in your suman.ioc.js file => '" + dep + "'");
                _suman.writeTestError(' => ...your available dependencies are: [' + deps + ']');
                obj[dep] = noKeyExistsPlaceholder;
            }
        }
        else {
            _suman.log.warning("warning: the following dep is not in your suman.ioc.js configuration '" + dep + "'");
            obj[dep] = noKeyExistsPlaceholder;
        }
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
        try {
            process.domain && process.domain.exit();
        }
        finally {
            process.nextTick(cb, null, obj);
        }
    }, function (err) {
        _suman.log.error('Error acquiring ioc dependency:', err.stack || err);
        try {
            process.domain && process.domain.exit();
        }
        finally {
            process.nextTick(cb, err, {});
        }
    });
};
