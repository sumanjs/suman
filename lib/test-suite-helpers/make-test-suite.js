'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants').constants;
var test_suite_base_constructor_1 = require("./test-suite-base-constructor");
var makeStartSuite = require('./make-start-suite').makeStartSuite;
var make_handle_befores_afters_1 = require("./make-handle-befores-afters");
var makeNotifyParent = require('./notify-parent-that-child-is-complete').makeNotifyParent;
var make_it_1 = require("../test-suite-methods/make-it");
var make_after_1 = require("../test-suite-methods/make-after");
var make_after_each_1 = require("../test-suite-methods/make-after-each");
var make_before_each_1 = require("../test-suite-methods/make-before-each");
var make_before_1 = require("../test-suite-methods/make-before");
var make_inject_1 = require("../test-suite-methods/make-inject");
var make_describe_1 = require("../test-suite-methods/make-describe");
var make_after_all_parent_hooks_1 = require("../test-suite-methods/make-after-all-parent-hooks");
var makeRunChild = function (val) {
    return function runChild(child, cb) {
        child._run(val, cb);
    };
};
exports.makeTestSuiteMaker = function (suman, gracefulExit, blockInjector) {
    var allDescribeBlocks = suman.allDescribeBlocks;
    var _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    var handleBeforesAndAfters = make_handle_befores_afters_1.makeHandleBeforesAndAfters(suman, gracefulExit);
    var notifyParentThatChildIsComplete = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);
    return function TestSuiteMaker(data) {
        var TestSuite = function (obj) {
            this.interface = suman.interface;
            this.desc = this.title = obj.desc;
            this.timeout = function () {
                console.error(' => this.timeout is not implemented yet.');
            };
            this.slow = function () {
                console.error(' => this.slow is not implemented yet.');
            };
            var zuite = this;
            this.resume = function () {
                var args = Array.from(arguments);
                process.nextTick(function () {
                    zuite.__resume.apply(zuite, args);
                });
            };
            var inject = make_inject_1.makeInject(suman, zuite);
            var before = make_before_1.makeBefore(suman, zuite);
            var after = make_after_1.makeAfter(suman, zuite);
            var beforeEach = make_before_each_1.makeBeforeEach(suman, zuite);
            var afterEach = make_after_each_1.makeAfterEach(suman, zuite);
            var it = make_it_1.makeIt(suman, zuite);
            var describe = make_describe_1.makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite, notifyParentThatChildIsComplete, blockInjector);
            var afterAllParentHooks = make_after_all_parent_hooks_1.makeAfterAllParentHooks(suman, zuite);
            var ctx = this;
            var getProxy = function (method, rule, props) {
                return new Proxy(method, {
                    get: function (target, prop) {
                        props = props || [];
                        var hasSkip = false;
                        var newProps = props.concat(String(prop)).filter(function (v, i, a) {
                            if (String(v) === 'skip') {
                                hasSkip = true;
                            }
                            return a.indexOf(v) === i;
                        });
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
            this.describe = this.context = this.suite = getProxy(describe, rules.blockSignature);
            this.it = this.test = getProxy(it, rules.testCaseSignature);
            this.inject = getProxy(inject, rules.hookSignature);
            this.before = this.setup = getProxy(before, rules.hookSignature);
            this.beforeEach = this.setupTest = getProxy(beforeEach, rules.hookSignature);
            this.after = this.teardown = getProxy(after, rules.hookSignature);
            this.afterEach = this.teardownTest = getProxy(afterEach, rules.hookSignature);
            this.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature);
            Object.getPrototypeOf(this).get_describe = function () {
                return describe;
            };
            Object.getPrototypeOf(this).get_context = function () {
                return describe;
            };
            Object.getPrototypeOf(this).get_inject = function () {
                return inject;
            };
            Object.getPrototypeOf(this).get_it = function () {
                return it;
            };
            Object.getPrototypeOf(this).get_before = function () {
                return before;
            };
            Object.getPrototypeOf(this).get_after = function () {
                return after;
            };
            Object.getPrototypeOf(this).get_afterEach = function () {
                return afterEach;
            };
            Object.getPrototypeOf(this).get_beforeEach = function () {
                return beforeEach;
            };
        };
        TestSuite.prototype = Object.create(new test_suite_base_constructor_1.TestSuiteBase(data, suman));
        TestSuite.prototype.testBlockMethodCache = new Map();
        TestSuite.prototype.__bindExtras = function bindExtras() {
            suman.ctx = this;
        };
        TestSuite.prototype.__invokeChildren = function (val, start) {
            async.eachSeries(this.getChildren(), makeRunChild(val), start);
        };
        TestSuite.prototype.toString = function () {
            return this.constructor + ':' + this.desc;
        };
        TestSuite.prototype.log = function () {
            console.log.apply(console, [' [TESTSUITE LOGGER] => '].concat(Array.from(arguments)));
        };
        TestSuite.prototype.series = function (cb) {
            if (typeof cb === 'function') {
                cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
            }
            return this;
        };
        TestSuite.prototype.__startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParentThatChildIsComplete);
        return new TestSuite(data);
    };
};
