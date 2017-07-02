'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var _a = require('../injection/$core-n-$deps'), $core = _a.$core, $deps = _a.$deps, mappedPkgJSONDeps = _a.mappedPkgJSONDeps;
exports.makePostInjector = function ($data, $preData) {
    return function (names) {
        return names.map(function (n) {
            if (n === '$core') {
                return $core;
            }
            if (n === '$deps') {
                return $deps;
            }
            if (n === '$data') {
                return $data;
            }
            if (n === '$root') {
                return _suman.projectRoot;
            }
            if (n === '$pre') {
                return $preData || _suman['$pre'] || _suman.integrantHashKeyVals;
            }
            try {
                return require(n);
            }
            catch (err) {
                _suman.logError('warning => [suman.once.post injector] => Suman will continue optimistically, ' +
                    'but cannot require dependency with name => "' + n + '"');
                return null;
            }
        });
    };
};
