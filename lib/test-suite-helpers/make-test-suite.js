'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var incrementer_1 = require("../misc/incrementer");
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants').constants;
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
var symbols_1 = require("../helpers/symbols");
var makeRunChild = function (val) {
    return function runChild(child, cb) {
        child._run(val, cb);
    };
};
exports.makeTestSuite = function (suman, gracefulExit, blockInjector) {
    var _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    var handleBeforesAndAfters = make_handle_befores_afters_1.makeHandleBeforesAndAfters(suman, gracefulExit);
    var notifyParent = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);
    var TestSuite = (function () {
        function TestSuite(obj) {
            var sumanOpts = _suman.sumanOpts;
            this.opts = obj.opts;
            this.testId = incrementer_1.incr();
            this.isSetupComplete = false;
            var parallel = obj.opts.parallel;
            var mode = obj.opts.mode;
            var fixed = this.fixed = (this.opts.fixed || false);
            this.parallel = (sumanOpts.parallel && !fixed) || (!sumanOpts.series && (parallel === true || mode === 'parallel'));
            this.skipped = this.opts.skip || false;
            this.only = this.opts.only || false;
            this.filename = suman.filename;
            this.childCompletionCount = 0;
            var children = [];
            var tests = [];
            var parallelTests = [];
            var testsParallel = [];
            var loopTests = [];
            var befores = [];
            var beforeEaches = [];
            var afters = [];
            var aftersLast = [];
            var afterEaches = [];
            var injections = [];
            this.completedChildrenMap = new Map();
            var getAfterAllParentHooks = [];
            this.getAfterAllParentHooks = function () {
                return getAfterAllParentHooks;
            };
            this.mergeAfters = function () {
                while (aftersLast.length > 0) {
                    afters.push(aftersLast.shift());
                }
            };
            this.injectedValues = {};
            this.getInjectedValue = function (key) {
                if (key in this.injectedValues) {
                    return this.injectedValues[key];
                }
                else if (this.parent) {
                    return this.parent.getInjectedValue(key);
                }
            };
            this.getInjections = function () {
                return injections;
            };
            this.getChildren = function () {
                return children;
            };
            this.getTests = function () {
                return tests;
            };
            this.getParallelTests = function () {
                return parallelTests;
            };
            this.getTestsParallel = function () {
                return testsParallel;
            };
            this.getLoopTests = function () {
                return loopTests;
            };
            this.getBefores = function () {
                return befores;
            };
            this.getBeforeEaches = function () {
                return beforeEaches;
            };
            this.getAftersLast = function () {
                return aftersLast;
            };
            this.getAfters = function () {
                return afters;
            };
            this.getAfterEaches = function () {
                return afterEaches;
            };
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
            var describe = make_describe_1.makeDescribe(suman, gracefulExit, TestSuite, zuite, notifyParent, blockInjector);
            var getProxy = make_proxy_1.makeProxy(suman, zuite);
            this.describe = this.context = this.suite = getProxy(describe, rules.blockSignature);
            this.it = this.test = getProxy(it, rules.testCaseSignature);
            this.inject = getProxy(inject, rules.hookSignature);
            this.before = this.beforeAll = this.setup = getProxy(before, rules.hookSignature);
            this.beforeEach = this.setupTest = getProxy(beforeEach, rules.hookSignature);
            this.after = this.afterAll = this.teardown = getProxy(after, rules.hookSignature);
            this.afterEach = this.teardownTest = getProxy(afterEach, rules.hookSignature);
            this.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature);
            this[symbols_1.default.context] = this[symbols_1.default.describe] = this[symbols_1.default.suite] = function () {
                return describe;
            };
            this.get_inject = function () {
                return inject;
            };
            this[symbols_1.default.test] = this[symbols_1.default.it] = function () {
                return it;
            };
            this[symbols_1.default.before] = this[symbols_1.default.setup] = this[symbols_1.default.beforeall] = function () {
                return before;
            };
            this[symbols_1.default.after] = this[symbols_1.default.afterall] = this[symbols_1.default.teardown] = function () {
                return after;
            };
            this[symbols_1.default.aftereach] = this[symbols_1.default.teardowntest] = function () {
                return afterEach;
            };
            this[symbols_1.default.beforeeach] = this[symbols_1.default.setuptest] = function () {
                return beforeEach;
            };
            this.__bindExtras = function bindExtras() {
                suman.ctx = this;
            };
            this.__invokeChildren = function (val, start) {
                async.eachSeries(this.getChildren(), makeRunChild(val), start);
            };
            this.testBlockMethodCache = new Map();
            this.toString = function () {
                return 'cheeseburger' + this.desc;
            };
            this.log = console.log.bind(console, 'my test suite =>');
            this.series = function (cb) {
                if (typeof cb === 'function') {
                    cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
                }
                return this;
            };
        }
        return TestSuite;
    }());
    TestSuite.prototype.startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
    return TestSuite;
};
