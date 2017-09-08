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
var suman_constants_1 = require("../../config/suman-constants");
var ioc_injector_1 = require("../injection/ioc-injector");
var resolve_shared_dirs_1 = require("../helpers/resolve-shared-dirs");
var load_shared_objects_1 = require("../helpers/load-shared-objects");
var IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
var thisVal = { 'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.' };
exports.acquireIocDeps = function (suman, deps, suite, cb) {
    if (suite.parent) {
        assert(!suite.isRootSuite, 'Suman implementation error => we expect a non-root suite here. Please report.');
        return process.nextTick(cb, null, {});
    }
    var iocPromiseContainer = {};
    var sumanPaths = resolve_shared_dirs_1.resolveSharedDirs(_suman.sumanConfig, _suman.projectRoot, _suman.sumanOpts);
    var iocFn = load_shared_objects_1.loadSharedObjects(sumanPaths, _suman.projectRoot, _suman.sumanOpts).iocFn;
    var dependencies = null;
    try {
        var iocFnArgs = fnArgs(iocFn);
        var getiocFnDeps = ioc_injector_1.makeIocInjector(suman.iocData, null, null);
        var iocFnDeps = getiocFnDeps(iocFnArgs);
        var iocRet = iocFn.apply(null, iocFnDeps);
        assert(suman_utils_1.default.isObject(iocRet.dependencies), ' => suman.ioc.js must export a function which returns an object with a dependencies property.');
        dependencies = iocRet.dependencies;
    }
    catch (err) {
        _suman.logError(err.stack || err);
        _suman.logError('despite the error, suman will continue optimistically.');
        dependencies = {};
    }
    var obj = {};
    deps.forEach(function (dep) {
        if (includes(suman_constants_1.constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in dependencies) {
            throw new Error('Warning: you added a IoC dependency for "' + dep +
                '" but this is a reserved internal Suman dependency injection value.');
        }
        if (suite.parent) {
            throw new Error('Suman implementation error, the root suite should not reach this point.');
        }
        if (dep in dependencies) {
            obj[dep] = dependencies[dep];
            if (!obj[dep] && !includes(suman_constants_1.constants.CORE_MODULE_LIST, String(dep)) &&
                !includes(suman_constants_1.constants.SUMAN_HARD_LIST, String(dep))) {
                var deps_1 = Object.keys(dependencies || {}).map(function (item) {
                    return ' "' + item + '" ';
                });
                _suman._writeTestError(new Error('The following desired dependency is not in your suman.ioc.js file: "' + dep + '"\n' +
                    ' => ...your available dependencies are: [' + deps_1 + ']').stack);
            }
        }
        else {
            obj[dep] = '[suman reserved - no ioc match]';
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
        process.domain && process.domain.exit();
        process.nextTick(cb, null, obj);
    }, function (err) {
        _suman.logError('Error acquiring ioc dependency:', err.stack || err);
        process.domain && process.domain.exit();
        process.nextTick(cb, err, {});
    });
};
