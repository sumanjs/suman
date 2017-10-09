'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var symbols_1 = require("../helpers/symbols");
var possibleProps = {
    describe: true,
    beforeeach: true,
    aftereach: true,
    beforeall: true,
    afterall: true,
    after: true,
    before: true,
    context: true,
    it: true,
    test: true,
    setuptest: true,
    teardowntest: true,
    setup: true,
    teardown: true,
    events: true,
    errorevents: true,
    successevents: true,
    skip: true,
    fatal: true,
    parallel: true,
    series: true,
    cb: true,
    only: true,
    plan: true,
    throws: true,
    timeout: true,
    always: true,
    last: true,
    __preparsed: true
};
exports.makeInjectionContainer = function (suman) {
    var getProxy = function (val, props) {
        return new Proxy(val, {
            get: function (target, prop) {
                if (typeof prop === 'symbol') {
                    return Reflect.get.apply(Reflect, arguments);
                }
                var meth = String(prop).toLowerCase();
                if (!possibleProps[meth]) {
                    try {
                        return Reflect.get.apply(Reflect, arguments);
                    }
                    catch (err) {
                        throw new Error("Test suite may not have a '" + prop + "' property or method.\n" + err.stack);
                    }
                }
                var hasSkip = false;
                var newProps = props.concat(String(prop))
                    .map(function (v) { return String(v).toLowerCase(); })
                    .filter(function (v, i, a) {
                    if (v === 'skip') {
                        hasSkip = true;
                    }
                    return a.indexOf(v) === i;
                });
                var method = String(newProps.shift()).toLowerCase();
                newProps = newProps.sort();
                newProps.unshift(method);
                if (hasSkip) {
                    newProps = [method, 'skip'];
                }
                newProps = newProps.map(function (v) { return String(v).toLowerCase(); });
                var cache, cacheId = newProps.join('-');
                if (cache = suman.testBlockMethodCache[cacheId]) {
                    return cache;
                }
                var fn = function () {
                    var rule;
                    if (method === 'describe' || method === 'context') {
                        rule = rules.blockSignature;
                    }
                    else if (method === 'it' || method === 'test') {
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
                    var getter = symbols_1.default[method];
                    var meth = suman.ctx[getter];
                    if (!meth) {
                        throw new Error("property '" + method + "' is not available on test suite object.");
                    }
                    return meth().apply(suman.ctx, args);
                };
                return suman.testBlockMethodCache[cacheId] = getProxy(fn, newProps);
            }
        });
    };
    var container = {};
    return getProxy(container, []);
};
