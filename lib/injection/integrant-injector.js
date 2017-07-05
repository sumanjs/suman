'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var _a = require('../injection/$core-n-$deps'), $core = _a.$core, $deps = _a.$deps, mappedPkgJSONDeps = _a.mappedPkgJSONDeps;
function default_1(names) {
    return names.map(function (n) {
        if (n === '$core') {
            return $core;
        }
        if (n === '$deps') {
            return $deps;
        }
        if (n === '$root') {
            return _suman.projectRoot;
        }
        try {
            return require(n);
        }
        catch (err) {
            _suman.logError('warning => suman cannot require dependency with name => "' + n + '";' +
                ' Suman will continue optimistically.');
            console.error('\n');
            return null;
        }
    });
}
exports.default = default_1;
;
