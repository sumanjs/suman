'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var util = require("util");
var assert = require("assert");
var async = require("async");
var chalk = require("chalk");
var suman_utils_1 = require("suman-utils");
var _ = require("lodash");
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var callbackOrPromise = require('./callback-or-promise');
var make_post_injector_1 = require("./injection/make-post-injector");
exports.run = function ($oncePostKeys, userDataObj, cb) {
    try {
        assert(Array.isArray($oncePostKeys), ' => (1) Perhaps we exited before <oncePostKeys> was captured.');
    }
    catch (err) {
        _suman.logError('\n', suman_utils_1.default.decomposeError(err), '\n\n');
    }
    var oncePostKeys = _.flattenDeep($oncePostKeys);
    try {
        assert(suman_utils_1.default.isObject(userDataObj), ' =>  (2) Perhaps we exited before <userDataObj> was captured.');
    }
    catch (err) {
        _suman.logError('\n => Suman internal message => ', suman_utils_1.default.decomposeError(err), '\n\n');
        userDataObj = {};
    }
    var postInjector = make_post_injector_1.makePostInjector(userDataObj, null);
    var first = suman_utils_1.default.onceAsync(this, cb);
    var oncePostModule, oncePostModuleRet, dependencies, oncePosts = {}, hasonlyPostKeys = oncePostKeys.length > 0;
    if (!hasonlyPostKeys) {
        return first(null, []);
    }
    try {
        oncePostModule = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.once.post.js'));
    }
    catch (err) {
        console.error('\n', ' => Suman usage warning => you have suman.once.post defined, but no suman.once.post.js file.');
        console.error(err.stack || err);
        return first(err, []);
    }
    try {
        assert(typeof oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
    }
    catch (err) {
        console.log(' => Your suman.once.post.js file must export a function that returns an object.');
        console.error(err.stack || err);
        return first(null, []);
    }
    try {
        var argNames = fnArgs(oncePostModule);
        var argValues = postInjector(argNames);
        oncePostModuleRet = oncePostModule.apply(null, argValues);
    }
    catch (err) {
        console.log(' => Your suman.once.post.js file must export a function that returns an object.');
        console.error(err.stack || err);
        return first(null, []);
    }
    if (!suman_utils_1.default.isObject(oncePostModuleRet)) {
        _suman.logError('Your suman.once.post.js file must export a function that returns an object.');
        return first(null, []);
    }
    dependencies = oncePostModuleRet.dependencies;
    if (!suman_utils_1.default.isObject(dependencies)) {
        _suman.logError('Your suman.once.post.js file must export a function that returns an object, ' +
            'with a property named "dependencies".');
        return first(null, []);
    }
    oncePostKeys.forEach(function (k) {
        if (!(k in dependencies)) {
            console.error('\n');
            _suman.logError(colors.red('Suman usage error => your suman.once.post.js file ' +
                'is missing desired key ="' + k + '"'));
            return;
        }
        var o = oncePosts[k] = dependencies[k];
        if (!suman_utils_1.default.isArrayOrFunction(o)) {
            console.error(' => Suman is about to conk out =>\n\n' +
                ' => here is the contents return by the exported function in suman.once.post.js =>\n\n', oncePosts);
            console.error('\n');
            throw new Error(chalk.red(' => Suman usage warning => your suman.once.post.js ' +
                'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"'));
        }
    });
    var keys = Object.keys(oncePosts);
    if (keys.length) {
        console.log('\n', ' => Suman message => Suman is now running the desired hooks ' +
            'in suman.once.post.js, which include => \n\t', chalk.cyan(util.inspect(keys)));
    }
    else {
        return first(new Error('Your suman.once.post.js file is missing some keys present ' +
            'in your test file(s).'), []);
    }
    async.mapSeries(keys, function (k, cb) {
        callbackOrPromise(k, oncePosts, function (err) {
            cb(null, err);
        });
    }, function (err, results) {
        if (err) {
            console.error(err.stack || err);
            first(err, results);
        }
        else {
            console.log('\n\n', ' => Suman message => all suman.once.post.js hooks completed...exiting...');
            if (results.filter(function (i) { return i; }).length) {
                console.log('\n\n', ' => Suman message => it appears you have some errors ' +
                    'experienced in the shutdown hooks and are logged below =>', '\n\n');
            }
            first(null, results);
        }
    });
};
var $exports = module.exports;
exports.default = $exports;
