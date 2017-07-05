'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var su = require('suman-utils');
var camelcase = require('camelcase');
var _suman = global.__suman = (global.__suman || {});
var cwd = process.cwd();
var projectRoot = _suman.projectRoot = (_suman.projectRoot || su.findProjectRoot(cwd));
var constants = require('../../config/suman-constants').constants;
exports.mappedPkgJSONDeps = [];
exports.$deps = {};
exports.$core = {};
var pkgJSONDeps;
try {
    var pkgJSON = path.resolve(projectRoot + '/package.json');
    var pkg = require(pkgJSON);
    pkgJSONDeps = Object.keys(pkg.dependencies || {});
    if (true) {
        pkgJSONDeps = pkgJSONDeps.concat(Object.keys(pkg.devDependencies || {}));
        pkgJSONDeps = pkgJSONDeps.filter(function (item, i) {
            return pkgJSONDeps.indexOf(item === i);
        });
    }
}
catch (err) {
    console.log('\n', (err.stack || err), '\n');
    pkgJSONDeps = [];
}
pkgJSONDeps.forEach(function (d) {
    var dashToLodash = String(d).replace('-', '_');
    var camel = camelcase(d);
    exports.mappedPkgJSONDeps.push(dashToLodash);
    try {
        Object.defineProperty(exports.$deps, dashToLodash, {
            get: function () {
                return require(d);
            }
        });
        if (camel !== dashToLodash) {
            camel = camel.charAt(0).toUpperCase() + camel.slice(1);
            exports.mappedPkgJSONDeps.push(camel);
            Object.defineProperty(exports.$deps, camel, {
                get: function () {
                    return require(d);
                }
            });
        }
    }
    catch (err) {
        _suman.logWarning('warning => ', err.message || err);
        console.error('\n');
    }
});
constants.CORE_MODULE_LIST.forEach(function (c) {
    Object.defineProperty(exports.$core, c, {
        get: function () {
            return require(c);
        }
    });
});
