'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var pragmatik = require('pragmatik');
exports.makeProxy = function (suman, ctx) {
    return function getProxy(method, rule, props) {
        return new Proxy(method, {
            get: function (target, prop) {
                props = props || [];
                var hasSkip = false;
                var newProps = props.concat(String(prop)).filter(function (v, i, a) {
                    if (String(v).toLowerCase() === 'skip') {
                        hasSkip = true;
                    }
                    return a.indexOf(v) === i;
                })
                    .sort()
                    .map(function (v) { return String(v).toLowerCase(); });
                if (hasSkip) {
                    newProps = ['skip'];
                }
                var cache, cacheId = newProps.join('-');
                var fnCache = ctx.testBlockMethodCache.get(method);
                if (!fnCache) {
                    fnCache = {};
                    ctx.testBlockMethodCache.set(method, fnCache);
                }
                if (cache = ctx.testBlockMethodCache.get(method)[cacheId]) {
                    return cache;
                }
                var fn = function () {
                    var args = pragmatik.parse(arguments, rule);
                    newProps.forEach(function (p) {
                        args[1][p] = true;
                    });
                    args[1].__preParsed = true;
                    return method.apply(ctx, args);
                };
                return fnCache[cacheId] = getProxy(fn, rule, newProps);
            }
        });
    };
};
