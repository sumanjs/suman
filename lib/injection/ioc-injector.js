'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var _core_n__deps_1 = require("./$core-n-$deps");
var helpers_1 = require("./helpers");
function default_1($iocData, $preData, $ioc) {
    return function (names) {
        return names.map(function (n) {
            if (n === '$core') {
                return _core_n__deps_1.getCoreAndDeps().$core;
            }
            if (n === '$deps') {
                return _core_n__deps_1.getCoreAndDeps().$deps;
            }
            if (n === '$args') {
                return String(_suman.sumanOpts.user_args || '').split(/ +/).filter(function (i) { return i; });
            }
            if (n === '$argsRaw') {
                return _suman.sumanOpts.user_args || '';
            }
            if (n === '$data') {
                return $iocData;
            }
            if (n === '$root' || n === '$projectRoot') {
                return _suman.projectRoot;
            }
            if (n === '$index' || n === '$project') {
                return helpers_1.getProjectModule();
            }
            if (n === '$pre') {
                return $preData || _suman['$pre'] || null;
            }
            if (n === '$ioc') {
                return $ioc || _suman.$staticIoc;
            }
            try {
                return require(n);
            }
            catch (err) {
                _suman.logError('suman.ioc.js warning => cannot require dependency with name => "' + n + '";' +
                    ' Suman will continue optimistically.');
                console.error('\n');
                return null;
            }
        });
    };
}
exports.default = default_1;
;
