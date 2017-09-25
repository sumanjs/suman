'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
exports.makeInjectionContainer = function (suman) {
    var getProxy = function (val, props) {
        return new Proxy(val, {
            get: function (target, prop) {
                var hasSkip = false;
                var newProps = props.concat(String(prop)).filter(function (v, i, a) {
                    if (String(v) === 'skip') {
                        hasSkip = true;
                    }
                    return a.indexOf(v) === i;
                });
                var method = newProps[0];
                if (hasSkip) {
                    newProps = [method, 'skip'];
                }
                var cache, cacheId = newProps.join('-');
                var fn = function () {
                    var rule;
                    if (method === 'describe') {
                        rule = rules.blockSignature;
                    }
                    else if (method === 'it') {
                        rule = rules.testCaseSignature;
                    }
                    else {
                        rule = rules.hookSignature;
                    }
                    var args = pragmatik.parse(arguments, rule);
                    newProps.slice(1).forEach(function (p) {
                        args[1][p] = true;
                    });
                    args[1].__preParsed = true;
                    var getter = "get_" + method;
                    return suman.ctx[getter]().apply(suman.ctx, args);
                };
                return suman.testBlockMethodCache[cacheId] = getProxy(fn, newProps);
            }
        });
    };
    var container = {};
    return getProxy(container, []);
};
