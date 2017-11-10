'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var cp = require("child_process");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
exports.run = function () {
    return function runSumanWithPromise(runOptions) {
        if (runOptions.useGlobalVersion && runOptions.useLocalVersion) {
            throw new Error('Suman run routine cannot use both local and global versions -> check your options object passed to suman.run()');
        }
        if (!Array.isArray(runOptions.args)) {
            throw new Error('"args" property must be an array.');
        }
        if (runOptions.args.length < 1) {
            throw new Error('You must pass at least one argument to the suman executable, try "--" or "--default", if nothing else.');
        }
        if (runOptions.env && su.isObject(runOptions.env)) {
            throw new Error('"env" property must be a plain object.');
        }
        var executable, args = runOptions.args, env = runOptions.env || {};
        if (runOptions.useGlobalVersion) {
            executable = 'suman';
        }
        else if (runOptions.useLocalVersion) {
            executable = path.resolve(_suman.projectRoot + '/node_modules/.bin/suman');
        }
        else {
            executable = 'suman';
        }
        return new Promise(function (resolve, reject) {
            var k = cp.spawn('suman', args, {
                env: Object.assign({}, process.env, env),
            });
            k.stdout.pause();
            k.stderr.pause();
            k.once('error', function (err) {
                _suman.log.error('Suman run spawn error:', err.stack || err);
                reject(err);
            });
            setImmediate(function () {
                resolve({
                    sumanProcess: k
                });
            });
        });
    };
};
exports.setupRunCb = function (runSumanWithPromise) {
    runSumanWithPromise.cb = function runSumanWithCallback(runOptions, cb) {
        runSumanWithPromise(runOptions).then(function (val) {
            cb(null, val);
        }, cb);
    };
};
