'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var _suman = global.__suman = (global.__suman || {});
exports.findPathOfRunDotSh = function (p) {
    if (String(p).match(/\/@target\//)) {
        return null;
    }
    var root = _suman.projectRoot;
    var ln = root.length;
    while (p.length >= ln) {
        var dirname = path.dirname(p);
        var map = _suman.markersMap[dirname];
        if (map && map['@run.sh']) {
            return path.resolve(dirname, '@run.sh');
        }
        p = path.resolve(p + '/../');
    }
    return undefined;
};
exports.findPathOfTransformDotSh = function (p) {
    if (String(p).match(/\/@target\//)) {
        return null;
    }
    var root = _suman.projectRoot;
    var ln = root.length;
    while (p.length >= ln) {
        var dirname = path.dirname(p);
        var map = _suman.markersMap[dirname];
        if (map && map['@transform.sh']) {
            return path.resolve(dirname, '@transform.sh');
        }
        p = path.resolve(p + '/../');
    }
    return undefined;
};
var $exports = module.exports;
exports.default = $exports;
