'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
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
        if (map && map['@config.json']) {
            try {
                var config = require(path.resolve(dirname, '@config.json'));
                var v = void 0;
                if (v = config['@run']) {
                    if (v.prevent) {
                        return null;
                    }
                    if (v.plugin && v.plugin.value) {
                        var plugin = require(v.plugin.value);
                        return plugin.getRunPath();
                    }
                    else if (v.plugin) {
                        throw new Error('"plugin" should be an object with a "value" property.');
                    }
                }
            }
            catch (err) {
                _suman.log.warning('Your @config.json file may be malformed at path: ', dirname);
                _suman.log.error(err.message || err);
            }
        }
        p = path.resolve(p + '/../');
    }
    return null;
};
exports.findPathAndConfigOfRunDotSh = function (p) {
    var ret = {
        'config': null,
        'runPath': null
    };
    var root = _suman.projectRoot;
    var ln = root.length;
    while (p.length >= ln) {
        var dirname = path.dirname(p);
        var map = _suman.markersMap[dirname];
        if (map && map['@config.json']) {
            try {
                var v = void 0, config = require(path.resolve(dirname, '@config.json'));
                if (v = config['@run']) {
                    if (v.prevent) {
                        _suman.log.warning('File with the following path was prevented from running with a setting in @config.json.');
                        _suman.log.warning(p);
                    }
                    if (v.plugin && v.plugin.value) {
                        var plugin = require(v.plugin.value);
                        ret.runPath = plugin.getRunPath();
                    }
                    else if (v.plugin) {
                        throw new Error('"plugin" should be an object with a "value" property.');
                    }
                }
            }
            catch (err) {
                _suman.log.warning('Your @config.json file may be malformed at path: ', dirname);
                _suman.log.error(err.message || err);
            }
        }
        p = path.resolve(p + '/../');
    }
    return ret;
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
        if (map && map['@config.json']) {
            try {
                var v = void 0, config = require(path.resolve(dirname, '@config.json'));
                if (v = config['@transform']) {
                    if (v.prevent) {
                        return null;
                    }
                    if (v.plugin && v.plugin.value) {
                        var plugin = require(v.plugin.value);
                        return plugin.getTransformPath();
                    }
                    else if (v.plugin) {
                        throw new Error('"plugin" should be an object with a "value" property.');
                    }
                }
            }
            catch (err) {
                _suman.log.warning('Your @config.json file may be malformed at path: ', dirname);
                _suman.log.error(err.message || err);
            }
        }
        p = path.resolve(p + '/../');
    }
    return null;
};
var $exports = module.exports;
exports.default = $exports;
