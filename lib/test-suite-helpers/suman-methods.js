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
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var constants = require('../../config/suman-constants').constants;
var make_block_injector_1 = require("../injection/make-block-injector");
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
var makeProxy = function (suman) {
    return function getProxy(method, rule, props) {
        return new Proxy(method, {
            get: function (target, prop) {
                if (typeof prop === 'symbol') {
                    return Reflect.get.apply(Reflect, arguments);
                }
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
exports.makeSumanMethods = function (suman, TestBlock, gracefulExit, notifyParent) {
    var m = {};
    var blockInjector = make_block_injector_1.makeBlockInjector(suman, m);
    var inject = make_inject_1.makeInject(suman);
    var before = make_before_1.makeBefore(suman);
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
    return blockInjector;
};
