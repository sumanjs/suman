'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var EE = require("events");
var chalk = require("chalk");
var uniq = require('lodash.uniq');
var _ = require("lodash");
var events = require('suman-events').events;
var fnArgs = require("function-arguments");
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var make_post_injector_1 = require("../injection/make-post-injector");
var acquire_post_deps_1 = require("../acquire-dependencies/acquire-post-deps");
var userData = { 'chuck': 'chuck robbins' };
exports.makeBeforeExit = function (runnerObj, oncePosts, allOncePostKeys) {
    return function beforeExitRunOncePost(cb) {
        if (!runnerObj.hasOncePostFile) {
            return process.nextTick(cb);
        }
        var flattenedAllOncePostKeys = _.flattenDeep(allOncePostKeys).filter(function (v, i, a) {
            return a.indexOf(v) === i;
        });
        var args = fnArgs(runnerObj.oncePostModule);
        var postInjector = make_post_injector_1.makePostInjector(userData, null, null);
        var oncePostModuleRet = runnerObj.oncePostModule.apply(null, postInjector(args));
        assert(suman_utils_1.default.isObject(oncePostModuleRet), 'suman.once.post.js must return an object from the exported function.');
        var dependencies = oncePostModuleRet.dependencies;
        assert(suman_utils_1.default.isObject(dependencies), 'the object returned from the exported function in suman.once.post.js must have a "dependencies" property.');
        flattenedAllOncePostKeys.forEach(function (k) {
            if (!(k in dependencies)) {
                console.error('\n');
                _suman.log.error(chalk.red('Suman usage error => your suman.once.post.js file ' +
                    'is missing desired key ="' + k + '"'));
                return;
            }
            if (!suman_utils_1.default.isArrayOrFunction(dependencies[k])) {
                console.error('\n');
                _suman.log.error(chalk.red('Suman usage error => your suman.once.post.js file ' +
                    'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"'));
            }
        });
        var keys = Object.keys(oncePosts);
        if (keys.length) {
            console.log('\n');
            _suman.log.info(chalk.gray.bold('Suman is now running the desired hooks in suman.once.post.js, which include =>') +
                '\n\t', chalk.cyan(util.inspect(keys)));
        }
        acquire_post_deps_1.acquirePostDeps(keys, dependencies).then(function () {
            console.log('\n');
            _suman.log.info('all suman.once.post.js hooks completed successfully.\n\n');
            process.nextTick(cb);
        }, function (err) {
            _suman.log.error(err.stack || err);
            process.nextTick(cb, err);
        });
    };
};
