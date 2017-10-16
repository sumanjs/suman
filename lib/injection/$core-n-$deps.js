'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var camelcase = require('camelcase');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var values = null;
exports.getCoreAndDeps = function () {
    if (!values) {
        var p = new Proxy({}, {
            get: function (target, prop) {
                var trimmed = String(prop).trim();
                try {
                    return require(trimmed);
                }
                catch (err) { }
                var replaceLodashWithDash = trimmed.replace(/_/g, '-');
                if (replaceLodashWithDash !== trimmed) {
                    try {
                        return require(replaceLodashWithDash);
                    }
                    catch (err) { }
                    throw new Error("could not require dependencies with names '" + trimmed + "' or '" + replaceLodashWithDash + "'.");
                }
                throw new Error("could not require dependency with name '" + trimmed + "'");
            }
        });
        values = {
            $core: p,
            $deps: p,
            $require: p
        };
    }
    return values;
};
