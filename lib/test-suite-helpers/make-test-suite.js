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
var make_proxy_1 = require("./make-proxy");
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
    return function TestSuiteMaker(data) {
        var _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
        var handleBeforesAndAfters = make_handle_befores_afters_1.makeHandleBeforesAndAfters(suman, gracefulExit);
        var notifyParent = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);
        var TestSuite = function (obj) {
            this.interface = suman.interface;
            this.desc = this.title = obj.desc;
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
            var afterAllParentHooks = make_after_all_parent_hooks_1.makeAfterAllParentHooks(suman, zuite);
            var describe = make_describe_1.makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite, notifyParent, blockInjector);
            var getProxy = make_proxy_1.makeProxy(suman, zuite);
            this.describe = this.context = this.suite = getProxy(describe, rules.blockSignature);
            this.it = this.test = getProxy(it, rules.testCaseSignature);
            this.inject = getProxy(inject, rules.hookSignature);
            this.before = this.beforeAll = this.setup = getProxy(before, rules.hookSignature);
            this.beforeEach = this.setupTest = getProxy(beforeEach, rules.hookSignature);
            this.after = this.afterAll = this.teardown = getProxy(after, rules.hookSignature);
            this.afterEach = this.teardownTest = getProxy(afterEach, rules.hookSignature);
            this.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature);
            var proto = Object.getPrototypeOf(this);
            proto.get_describe = proto.get_context = function () {
                return describe;
            };
            proto.get_inject = function () {
                return inject;
            };
            proto.get_it = proto.get_test = function () {
                return it;
            };
            proto.get_before = proto.get_beforeall = proto.get_setup = function () {
                return before;
            };
            proto.get_after = proto.get_afterall = proto.get_teardown = function () {
                return after;
            };
            proto.get_aftereach = proto.get_teardowntest = function () {
                return afterEach;
            };
            proto.get_beforeeach = proto.get_setuptest = function () {
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
        TestSuite.prototype.log = console.log.bind(console, 'my test suite =>');
        TestSuite.prototype.series = function (cb) {
            if (typeof cb === 'function') {
                cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
            }
            return this;
        };
        TestSuite.prototype.__startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
        return new TestSuite(data);
    };
};
