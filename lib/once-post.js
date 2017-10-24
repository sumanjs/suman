'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var util = require("util");
var assert = require("assert");
var chalk = require("chalk");
var suman_utils_1 = require("suman-utils");
var _ = require("lodash");
var fnArgs = require('function-arguments');
var _suman = global.__suman = (global.__suman || {});
var make_post_injector_1 = require("./injection/make-post-injector");
var acquire_post_deps_1 = require("./acquire-dependencies/acquire-post-deps");
exports.run = function ($oncePostKeys, userDataObj, cb) {
    try {
        assert(Array.isArray($oncePostKeys), ' => (1) Perhaps we exited before <oncePostKeys> was captured.');
    }
    catch (err) {
        _suman.log.error('\n', suman_utils_1.default.decomposeError(err), '\n\n');
        return process.nextTick(cb);
    }
    var oncePostKeys = _.flattenDeep($oncePostKeys).filter(function (v, i, a) {
        return a.indexOf(v) === i;
    });
    try {
        assert(suman_utils_1.default.isObject(userDataObj), ' =>  (2) Perhaps we exited before <userDataObj> was captured.');
    }
    catch (err) {
        console.error('\n');
        _suman.log.error(suman_utils_1.default.decomposeError(err), '\n\n');
        userDataObj = {};
    }
    var postInjector = make_post_injector_1.makePostInjector(userDataObj, null, null);
    var first = suman_utils_1.default.onceAsync(this, cb);
    var oncePostModule, oncePostModuleRet, dependencies, hasonlyPostKeys = oncePostKeys.length > 0;
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
        _suman.log.error('Your suman.once.post.js file must export a function that returns an object.');
        return first(null, []);
    }
    dependencies = oncePostModuleRet.dependencies;
    if (!suman_utils_1.default.isObject(dependencies)) {
        _suman.log.error('Your suman.once.post.js file must export a function that returns an object, ' +
            'with a property named "dependencies".');
        return first(null, []);
    }
    var missingKeys = [];
    oncePostKeys.forEach(function (k) {
        if (!(k in dependencies)) {
            missingKeys.push(k);
            console.error('\n');
            _suman.log.error(chalk.red('Suman usage error => your suman.once.post.js file ' +
                ("is missing desired key = \"" + k + "\"")));
            return;
        }
        if (!suman_utils_1.default.isArrayOrFunction(dependencies[k])) {
            console.error(' => Suman is about to conk out =>\n\n' +
                ' => here is the contents return by the exported function in suman.once.post.js =>\n\n', dependencies);
            console.error('\n');
            throw new Error(chalk.red(' => Suman usage warning => your suman.once.post.js ' +
                'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"'));
        }
    });
    if (oncePostKeys.length > 0) {
        _suman.log.info('Suman is now running the desired hooks ' +
            'in suman.once.post.js, listed as follows =>');
        oncePostKeys.forEach(function (k, index) {
            _suman.log.info("(" + (index + 1) + ")", "\"" + chalk.cyan(k) + "\"");
        });
        console.log('\n');
    }
    if (missingKeys.length > 0) {
        _suman.log.error("Your suman.once.post.js file is missing some keys present in your test file(s).");
        _suman.log.error("The missing keys are as follows: " + chalk.magenta(util.inspect(missingKeys)));
        console.log('\n');
    }
    acquire_post_deps_1.acquirePostDeps(oncePostKeys, dependencies).then(function (val) {
        console.log('\n');
        _suman.log.info('all suman.once.post.js hooks completed successfully.\n');
        _suman.log.info('suman.once.post.js results => ');
        _suman.log.info(util.inspect(val));
        process.nextTick(cb);
    }, function (err) {
        console.error(err.stack || err);
        process.nextTick(cb, err);
    });
};
var $exports = module.exports;
exports.default = $exports;
