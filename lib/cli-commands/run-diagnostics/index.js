'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
exports.run = function (cb) {
    console.log(' => NODE_PATH => ', process.env.NODE_PATH);
    var deps = [];
    Object.keys(constants.SUMAN_GLOBAL_DEPS).forEach(function (k) {
        deps = deps.concat(constants.SUMAN_GLOBAL_DEPS[k]);
    });
    var reinstallThese = [];
    deps.forEach(function (obj) {
        Object.keys(obj).forEach(function (k) {
            var version = obj[k];
            var resolved = false;
            try {
                console.log('Attempting to require => ', k);
                require.resolve(k);
                resolved = true;
            }
            catch (err) {
                console.log(err.stack || err);
                if (resolved === false) {
                    var dep = {};
                    dep[k] = version;
                    reinstallThese.push(dep);
                }
            }
        });
    });
    console.log('\n');
    console.log(chalk.magenta(' => Suman diagnostics suggests the following deps need to be re-installed => '), '\n', reinstallThese);
    if (cb) {
        cb();
    }
    else {
        process.exit(0);
    }
};
