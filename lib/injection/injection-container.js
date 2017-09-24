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
                var newProps = props.concat(String(prop));
                var cache, cacheId = newProps.join('-');
                if (cache = suman.testBlockMethodCache[cacheId]) {
                    return cache;
                }
                var fn = function () {
                    var args = Array.from(arguments);
                    var ret = newProps.reduce(function (a, b) {
                        return a[b];
                    }, suman.ctx);
                    return ret.apply(suman.ctx, args);
                };
                return suman.testBlockMethodCache[cacheId] = getProxy(fn, newProps);
            }
        });
    };
    return getProxy({}, []);
    var container = {
        before: function () {
            return suman.ctx.before.apply(suman.ctx, arguments);
        },
        after: function () {
            return suman.ctx.after.apply(suman.ctx, arguments);
        },
        beforeEach: function () {
            return suman.ctx.beforeEach.apply(suman.ctx, arguments);
        },
        afterEach: function () {
            return suman.ctx.afterEach.apply(suman.ctx, arguments);
        },
        describe: function () {
            return suman.ctx.describe.apply(suman.ctx, arguments);
        },
        context: function () {
            return suman.ctx.context.apply(suman.ctx, arguments);
        },
        it: function () {
            return suman.ctx.it.apply(suman.ctx, arguments);
        },
        inject: function () {
            return suman.ctx.inject.apply(suman.ctx, arguments);
        },
        afterAllParentHooks: function () {
            return suman.ctx.afterAllParentHooks.apply(suman.ctx, arguments);
        },
    };
    container.describe.delay =
        function (desc, opts, arr, fn) {
            return suman.ctx.describe.delay.apply(suman.ctx, arguments);
        };
    container.describe.skip =
        function (desc, opts, arr, fn) {
            return suman.ctx.describe.skip.apply(suman.ctx, arguments);
        };
    container.describe.only =
        function (desc, opts, arr, fn) {
            return suman.ctx.describe.only.apply(suman.ctx, arguments);
        };
    container.describe.skip.delay = container.describe.delay.skip = container.describe.skip;
    container.describe.only.delay = container.describe.delay.only =
        function (desc, opts, arr, fn) {
            suman.ctx.describe.only.delay.apply(suman.ctx, arguments);
        };
    container.it.skip = function (desc, opts, fn) {
        return suman.ctx.it.skip.apply(suman.ctx, arguments);
    };
    container.it.only = function (desc, opts, fn) {
        return suman.ctx.it.only.apply(suman.ctx, arguments);
    };
    container.it.only.cb = function (desc, opts, fn) {
        return suman.ctx.it.only.cb.apply(suman.ctx, arguments);
    };
    container.it.skip.cb = function (desc, opts, fn) {
        return suman.ctx.it.skip.cb.apply(suman.ctx, arguments);
    };
    container.it.cb = function (desc, opts, fn) {
        return suman.ctx.it.cb.apply(suman.ctx, arguments);
    };
    container.it.cb.skip = container.it.skip.cb;
    container.it.cb.only = container.it.only.cb;
    container.inject.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.inject.apply(this, args);
    };
    container.inject.skip = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.inject.apply(this, args);
    };
    container.inject.skip.cb = container.inject.cb.skip = container.inject.skip;
    container.before.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.before.apply(this, args);
    };
    container.before.skip = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.before.apply(this, args);
    };
    container.before.skip.cb = container.before.cb.skip = container.before.skip;
    container.after.skip = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.last = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].last = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.always = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].always = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.cb.always = function (desc, opts, fn) {
        return suman.ctx.after.cb.always.apply(suman.ctx, arguments);
    };
    container.after.cb.last = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].last = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.last.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].last = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.last.always = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].last = true;
        args[1].always = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.always.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].always = true;
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.always.last = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].last = true;
        args[1].always = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.cb.last.always =
        container.after.cb.always.last =
            container.after.last.cb.always =
                container.after.last.always.cb =
                    container.after.always.cb.last =
                        container.after.always.last.cb =
                            function (desc, opts, fn) {
                                var args = pragmatik.parse(arguments, rules.hookSignature);
                                args[1].last = true;
                                args[1].always = true;
                                args[1].cb = true;
                                args[1].__preParsed = true;
                                return container.after.apply(this, args);
                            };
    container.after.skip.cb =
        container.after.cb.skip =
            container.after.last.skip =
                container.after.skip.last =
                    container.after.always.skip =
                        container.after.skip.always = container.after.skip;
    container.after.skip.cb.last =
        container.after.skip.last.cb =
            container.after.skip.cb.always =
                container.after.skip.always.cb = container.after.skip;
    container.after.skip.cb.last.always =
        container.after.skip.last.cb.always =
            container.after.skip.cb.always.last =
                container.after.skip.always.cb.last = container.after.skip;
    container.beforeEach.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.beforeEach.apply(this, args);
    };
    container.beforeEach.skip = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.beforeEach.apply(this, args);
    };
    container.beforeEach.skip.cb = container.beforeEach.cb.skip = container.beforeEach.skip;
    container.afterEach.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.afterEach.apply(this, args);
    };
    container.afterEach.skip = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.afterEach.apply(this, args);
    };
    container.afterEach.skip.cb = container.afterEach.cb.skip = container.afterEach.skip;
    return container;
};
