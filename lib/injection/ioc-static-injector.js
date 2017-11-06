'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var helpers_1 = require("./helpers");
exports.makeIocStaticInjector = function () {
    return function (names) {
        return names.map(function (n) {
            if (n === '$core') {
                return helpers_1.getCoreAndDeps().$core;
            }
            if (n === '$deps') {
                return helpers_1.getCoreAndDeps().$deps;
            }
            if (n === '$args') {
                return String(_suman.sumanOpts.user_args || '').split(/ +/).filter(function (i) { return i; });
            }
            if (n === '$argsRaw') {
                return _suman.sumanOpts.user_args || '';
            }
            if (n === '$root' || n === '$projectRoot') {
                return _suman.projectRoot;
            }
            if (n === '$index' || n === '$project') {
                return helpers_1.getProjectModule();
            }
            return helpers_1.lastDitchRequire(n, '<suman.ioc.static.js>');
        });
    };
};
