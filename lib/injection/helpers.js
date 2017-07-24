"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _suman = global.__suman = (global.__suman || {});
exports.getProjectModule = function () {
    try {
        return require(_suman.projectRoot);
    }
    catch (err) {
        console.error('\n', err.stack || err, '\n');
        return null;
    }
};
