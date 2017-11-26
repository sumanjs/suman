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
var define_options_classes_1 = require("./define-options-classes");
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
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
                fn.define = target.define;
                fn.define.props = newProps;
                return fnCache[cacheId] = getProxy(fn, rule, newProps);
            }
        });
    };
};
var addDefine = function (fn, Clazz) {
    fn.define = function (desc, f) {
        if (typeof desc === 'function') {
            f = desc;
            desc = null;
        }
        var defObj = new Clazz(desc, fn);
        if (fn.define.props) {
            fn.define.props.forEach(function (p) {
                defObj.opts[p] = true;
            });
            delete fn.define.props;
        }
        if (f) {
            assert(typeof f === 'function', 'Optional argument to define() was expected to be a function.');
            f.call(null, defObj);
        }
        return defObj;
    };
    return fn;
};
exports.makeSumanMethods = function (suman, TestBlock, gracefulExit, notifyParent) {
    var m = {};
    suman.containerProxy = m;
    var blockInjector = block_injector_1.makeBlockInjector(suman, m);
    var createInjector = create_injector_1.makeCreateInjector(suman, m);
    var inject = addDefine(make_inject_1.makeInject(suman), define_options_classes_1.DefineObjectTestOrHook);
    var before = addDefine(make_before_1.makeBefore(suman), define_options_classes_1.DefineObjectAllHook);
    var after = addDefine(make_after_1.makeAfter(suman), define_options_classes_1.DefineObjectAllHook);
    var beforeEach = addDefine(make_before_each_1.makeBeforeEach(suman), define_options_classes_1.DefineObjectEachHook);
    var afterEach = addDefine(make_after_each_1.makeAfterEach(suman), define_options_classes_1.DefineObjectEachHook);
    var it = addDefine(make_it_1.makeIt(suman), define_options_classes_1.DefineObjectTestCase);
    var afterAllParentHooks = addDefine(make_after_all_parent_hooks_1.makeAfterAllParentHooks(suman), define_options_classes_1.DefineObjectAllHook);
    var describe = addDefine(make_describe_1.makeDescribe(suman, gracefulExit, TestBlock, notifyParent, blockInjector), define_options_classes_1.DefineObjectContext);
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
