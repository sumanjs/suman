'use strict';
var path = require('path');
var semver = require('semver');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants');
module.exports = function (cb) {
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
    console.log(colors.magenta(' => Suman diagnostics suggests the following deps need to be re-installed => '), '\n', reinstallThese);
    if (cb) {
        cb();
    }
    else {
        process.exit(0);
    }
};
