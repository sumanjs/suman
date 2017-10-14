'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require('assert');
var pragmatik = require('pragmatik');
exports.makeProxy = function (suman) {
    return function getProxy(method, rule, props) {
        return new Proxy(method, {
            get: function (target, prop) {
                props = props || [];
                var hasSkip = false;
                var newProps = props.concat(String(prop))
                    .map(function (v) { return String(v).toLowerCase(); })
                    .filter(function (v, i, a) {
                    if (v === 'skip') {
                        hasSkip = true;
                    }
                    return a.indexOf(v) === i;
                })
                    .sort();
                if (hasSkip) {
                    newProps = ['skip'];
                }
                var cache, cacheId = newProps.join('-');
                var fnCache = suman.testBlockMethodCache.get(method);
                if (!fnCache) {
                    fnCache = {};
                    suman.testBlockMethodCache.set(method, fnCache);
                }
                if (cache = suman.testBlockMethodCache.get(method)[cacheId]) {
                    return cache;
                }
                var fn = function () {
                    var args = pragmatik.parse(arguments, rule);
                    newProps.forEach(function (p) {
                        args[1][p] = true;
                    });
                    args[1].__preParsed = true;
                    return method.apply(null, args);
                };
                return fnCache[cacheId] = getProxy(fn, rule, newProps);
            }
        });
    };
};
