'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
exports.getProjectModule = function () {
    try {
        return require(_suman.projectRoot);
    }
    catch (err) {
        _suman.logError('\n', err.stack || err, '\n');
        return null;
    }
};
exports.lastDitchRequire = function (dep, requestorName) {
    requestorName = requestorName || '';
    try {
        return require(dep);
    }
    catch (err) {
        try {
            return require(String(dep).replace(/_/g, '-'));
        }
        catch (err) {
            _suman.logError("'" + requestorName + "' warning => cannot require dependency with name => '" + dep + "'.");
            _suman.logError('despite the missing dependency, Suman will continue optimistically.');
            console.error('\n');
            return null;
        }
    }
};
