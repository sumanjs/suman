'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var _suman = global.__suman = (global.__suman || {});
function findPathOfRunDotSh(p) {
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
    return null;
}
function findPathOfTransformDotSh(p) {
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
    return null;
}
module.exports = {
    findPathOfRunDotSh: findPathOfRunDotSh,
    findPathOfTransformDotSh: findPathOfTransformDotSh
};
