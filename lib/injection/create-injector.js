'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var _core_n__deps_1 = require("./$core-n-$deps");
module.exports = function ($iocData) {
    return function (names) {
        return names.map(function (n) {
            if (n === '$core') {
                return _core_n__deps_1.getCoreAndDeps().$core;
            }
            if (n === '$deps') {
                return _core_n__deps_1.getCoreAndDeps().$deps;
            }
            if (n === '$iocData') {
                return $iocData || { 'suman': 'bogus data - please report this error.' };
            }
            try {
                return require(n);
            }
            catch (err) {
                _suman.logError(' => Cannot require dependency with name => ' + n, '...suman will continue optimistically.');
                console.error('\n');
                return null;
            }
        });
    };
};
