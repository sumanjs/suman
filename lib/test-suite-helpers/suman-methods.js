'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var make_it_1 = require("../test-suite-methods/make-it");
var make_after_1 = require("../test-suite-methods/make-after");
var make_after_each_1 = require("../test-suite-methods/make-after-each");
var make_before_each_1 = require("../test-suite-methods/make-before-each");
var make_before_1 = require("../test-suite-methods/make-before");
var make_inject_1 = require("../test-suite-methods/make-inject");
var make_describe_1 = require("../test-suite-methods/make-describe");
var make_after_all_parent_hooks_1 = require("../test-suite-methods/make-after-all-parent-hooks");
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var su = require("suman-utils");
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var constants = require('../../config/suman-constants').constants;
var block_injector_1 = require("../injection/block-injector");
var create_injector_1 = require("../injection/create-injector");
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
    retries: true,
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
var makeProxy = function (suman) {
    return function getProxy(method, rule, props) {
        return new Proxy(method, {
            get: function (target, prop) {
                if (typeof prop === 'symbol') {
                    return Reflect.get.apply(Reflect, arguments);
                }
                props = props || [];
                if (prop === 'define') {
                    return target.define;
                }
                var hasSkip = false;
                var newProps = props.concat(String(prop))
                    .map(function (v) { return String(v).toLowerCase(); })
                    .filter(function (v, i, a) {
                    if (v === 'skip' || v === 'skipped') {
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
var DefineObject = (function () {
    function DefineObject(exec) {
        this.exec = exec;
        this.opts = {
            '@DefineObject': true,
            __preParsed: false
        };
    }
    DefineObject.prototype.inject = function () {
        return this;
    };
    DefineObject.prototype.name = function (v) {
        assert.equal(typeof v, 'string', 'Timeout value must be an integer.');
        this.opts.name = v;
        return this;
    };
    DefineObject.prototype.timeout = function (v) {
        assert(Number.isInteger(v), 'Timeout value must be an integer.');
        this.opts.timeout = v;
        return this;
    };
    DefineObject.prototype.source = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.opts.sourced = Array.from(arguments).reduce(function (a, b) {
            return a.concat(b);
        }, []);
        return this;
    };
    DefineObject.prototype.names = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.opts.names = Array.from(arguments).reduce(function (a, b) {
            return a.concat(b);
        }, []);
        return this;
    };
    DefineObject.prototype.run = function (fn) {
        var name = this.opts.name || '(unknown DefineObject name)';
        var opts = JSON.parse(su.customStringify(this.opts));
        this.exec.call(null, name, opts, fn);
        return this;
    };
    return DefineObject;
}());
exports.DefineObject = DefineObject;
var addDefineOld = function (fn) {
    fn.define = function (f) {
        var o = {};
        o.run = fn;
        debugger;
        f(o);
    };
    return fn;
};
var addDefine = function (fn) {
    fn.define = function (f) {
        var defObj = new DefineObject(fn);
        assert(typeof f === 'function', 'You must pass a (synchronous) callback as the first argument to define.');
        f.call(null, defObj);
    };
    return fn;
};
exports.makeSumanMethods = function (suman, TestBlock, gracefulExit, notifyParent) {
    var m = {};
    suman.containerProxy = m;
    var blockInjector = block_injector_1.makeBlockInjector(suman, m);
    var createInjector = create_injector_1.makeCreateInjector(suman, m);
    var inject = make_inject_1.makeInject(suman);
    var before = addDefine(make_before_1.makeBefore(suman));
    var after = make_after_1.makeAfter(suman);
    var beforeEach = make_before_each_1.makeBeforeEach(suman);
    var afterEach = make_after_each_1.makeAfterEach(suman);
    var it = make_it_1.makeIt(suman);
    var afterAllParentHooks = make_after_all_parent_hooks_1.makeAfterAllParentHooks(suman);
    var describe = make_describe_1.makeDescribe(suman, gracefulExit, TestBlock, notifyParent, blockInjector);
    var getProxy = makeProxy(suman);
    m.describe = m.context = m.suite = getProxy(describe, rules.blockSignature);
    m.it = m.test = getProxy(it, rules.testCaseSignature);
    m.inject = getProxy(inject, rules.hookSignature);
    m.before = m.beforeall = m.setup = getProxy(before, rules.hookSignature);
    m.beforeeach = m.setuptest = getProxy(beforeEach, rules.hookSignature);
    m.after = m.afterall = m.teardown = getProxy(after, rules.hookSignature);
    m.aftereach = m.teardowntest = getProxy(afterEach, rules.hookSignature);
    m.afterallparenthooks = getProxy(afterAllParentHooks, rules.hookSignature);
    return createInjector;
};
