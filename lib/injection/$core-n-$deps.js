'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var su = require("suman-utils");
var camelcase = require('camelcase');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var values = null;
exports.getCoreAndDeps = function () {
    if (!values) {
        var cwd = process.cwd();
        var projectRoot = (_suman.projectRoot || su.findProjectRoot(cwd));
        var mappedPkgJSONDeps_1 = [];
        var $deps_1 = {};
        var $core_1 = {};
        var pkgJSONDeps_1;
        try {
            var pkgJSON = path.resolve(projectRoot + '/package.json');
            var pkg = require(pkgJSON);
            pkgJSONDeps_1 = Object.keys(pkg.dependencies || {});
            if (true) {
                pkgJSONDeps_1 = pkgJSONDeps_1.concat(Object.keys(pkg.devDependencies || {}));
                pkgJSONDeps_1 = pkgJSONDeps_1.filter(function (item, i) {
                    return pkgJSONDeps_1.indexOf(item) === i;
                });
            }
        }
        catch (err) {
            console.log('\n', (err.stack || err), '\n');
            pkgJSONDeps_1 = [];
        }
        pkgJSONDeps_1.forEach(function (d) {
            var dashToLodash = String(d).replace('-', '_');
            var camel = camelcase(d);
            mappedPkgJSONDeps_1.push(dashToLodash);
            try {
                Object.defineProperty($deps_1, dashToLodash, {
                    get: function () {
                        return require(d);
                    }
                });
                if (camel !== dashToLodash) {
                    camel = camel.charAt(0).toUpperCase() + camel.slice(1);
                    mappedPkgJSONDeps_1.push(camel);
                    Object.defineProperty($deps_1, camel, {
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
            Object.defineProperty($core_1, c, {
                get: function () {
                    return require(c);
                }
            });
        });
        values = {
            $core: $core_1,
            $deps: $deps_1,
            mappedPkgJSONDeps: mappedPkgJSONDeps_1
        };
    }
    return values;
};
