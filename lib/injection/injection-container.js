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
                var fn = function () {
                    var args = Array.from(arguments);
                    var ret = newProps.reduce(function (a, b) {
                        return a[b];
                    }, _suman.ctx);
                    return ret.apply(_suman.ctx, args);
                };
                return getProxy(fn, newProps);
            }
        });
    };
    return getProxy({}, []);
    var container = {
        before: function () {
            return _suman.ctx.before.apply(_suman.ctx, arguments);
        },
        after: function () {
            return _suman.ctx.after.apply(_suman.ctx, arguments);
        },
        beforeEach: function () {
            return _suman.ctx.beforeEach.apply(_suman.ctx, arguments);
        },
        afterEach: function () {
            return _suman.ctx.afterEach.apply(_suman.ctx, arguments);
        },
        describe: function () {
            return _suman.ctx.describe.apply(_suman.ctx, arguments);
        },
        context: function () {
            return _suman.ctx.context.apply(_suman.ctx, arguments);
        },
        it: function () {
            return _suman.ctx.it.apply(_suman.ctx, arguments);
        },
        inject: function () {
            return _suman.ctx.inject.apply(_suman.ctx, arguments);
        },
        afterAllParentHooks: function () {
            return _suman.ctx.afterAllParentHooks.apply(_suman.ctx, arguments);
        },
    };
    container.describe.delay =
        function (desc, opts, arr, fn) {
            return _suman.ctx.describe.delay.apply(_suman.ctx, arguments);
        };
    container.describe.skip =
        function (desc, opts, arr, fn) {
            return _suman.ctx.describe.skip.apply(_suman.ctx, arguments);
        };
    container.describe.only =
        function (desc, opts, arr, fn) {
            return _suman.ctx.describe.only.apply(_suman.ctx, arguments);
        };
    container.describe.skip.delay = container.describe.delay.skip = container.describe.skip;
    container.describe.only.delay = container.describe.delay.only =
        function (desc, opts, arr, fn) {
            _suman.ctx.describe.only.delay.apply(_suman.ctx, arguments);
        };
    container.it.skip = function (desc, opts, fn) {
        return _suman.ctx.it.skip.apply(_suman.ctx, arguments);
    };
    container.it.only = function (desc, opts, fn) {
        return _suman.ctx.it.only.apply(_suman.ctx, arguments);
    };
    container.it.only.cb = function (desc, opts, fn) {
        return _suman.ctx.it.only.cb.apply(_suman.ctx, arguments);
    };
    container.it.skip.cb = function (desc, opts, fn) {
        return _suman.ctx.it.skip.cb.apply(_suman.ctx, arguments);
    };
    container.it.cb = function (desc, opts, fn) {
        return _suman.ctx.it.cb.apply(_suman.ctx, arguments);
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
    container.after.last = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].last = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
    container.after.cb = function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
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
        return _suman.ctx.after.cb.always.apply(_suman.ctx, arguments);
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
