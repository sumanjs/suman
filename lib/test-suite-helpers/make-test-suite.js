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
var freeze_existing_props_1 = require("freeze-existing-props");
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
    var TestSuiteMaker = function (data) {
        var it, describe, before, after, beforeEach, afterEach, inject, afterAllParentHooks;
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
            inject = this.inject = make_inject_1.makeInject(suman, zuite);
            before = make_before_1.makeBefore(suman, zuite);
            _interface === 'TDD' ? this.setup = before : this.before = before;
            after = make_after_1.makeAfter(suman, zuite);
            _interface === 'TDD' ? this.teardown = after : this.after = after;
            beforeEach = make_before_each_1.makeBeforeEach(suman, zuite);
            _interface === 'TDD' ? this.setupTest = beforeEach : this.beforeEach = beforeEach;
            afterEach = make_after_each_1.makeAfterEach(suman, zuite);
            _interface === 'TDD' ? this.teardownTest = afterEach : this.afterEach = afterEach;
            it = make_it_1.makeIt(suman, zuite);
            _interface === 'TDD' ? this.test = it : this.it = it;
            describe = this.context
                = make_describe_1.makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite, notifyParentThatChildIsComplete, blockInjector);
            _interface === 'TDD' ? this.suite = describe : this.describe = describe;
            afterAllParentHooks = this.afterAllParentHooks = make_after_all_parent_hooks_1.makeAfterAllParentHooks(suman, zuite);
        };
        TestSuite.prototype = Object.create(new test_suite_base_constructor_1.default(data, suman));
        TestSuite.prototype.__bindExtras = function bindExtras() {
            var ctx = _suman.ctx = this;
            describe.delay =
                function (desc, opts, arr, fn) {
                    var args = pragmatik.parse(arguments, rules.blockSignature);
                    args[1].delay = true;
                    args[1].__preParsed = true;
                    describe.apply(ctx, args);
                };
            describe.skip =
                function (desc, opts, arr, fn) {
                    var args = pragmatik.parse(arguments, rules.blockSignature);
                    args[1].skip = true;
                    args[1].__preParsed = true;
                    describe.apply(ctx, args);
                };
            describe.only =
                function (desc, opts, arr, fn) {
                    suman.describeOnlyIsTriggered = true;
                    var args = pragmatik.parse(arguments, rules.blockSignature);
                    args[1].only = true;
                    args[1].__preParsed = true;
                    describe.apply(ctx, args);
                };
            describe.skip.delay = describe.delay.skip = describe.skip;
            describe.only.delay = describe.delay.only =
                function (desc, opts, arr, fn) {
                    suman.describeOnlyIsTriggered = true;
                    var args = pragmatik.parse(arguments, rules.blockSignature);
                    args[1].only = true;
                    args[1].delay = true;
                    args[1].__preParsed = true;
                    describe.apply(ctx, args);
                };
            it.skip = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.testCaseSignature);
                args[1].skip = true;
                args[1].__preParsed = true;
                return it.apply(ctx, args);
            };
            it.only = function (desc, opts, fn) {
                suman.itOnlyIsTriggered = true;
                var args = pragmatik.parse(arguments, rules.testCaseSignature);
                args[1].only = true;
                args[1].__preParsed = true;
                return it.apply(ctx, args);
            };
            it.only.cb = function (desc, opts, fn) {
                suman.itOnlyIsTriggered = true;
                var args = pragmatik.parse(arguments, rules.testCaseSignature);
                args[1].only = true;
                args[1].cb = true;
                args[1].__preParsed = true;
                return it.apply(ctx, args);
            };
            it.skip.cb = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.testCaseSignature);
                args[1].skip = true;
                args[1].cb = true;
                args[1].__preParsed = true;
                return it.apply(ctx, args);
            };
            it.cb = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.testCaseSignature);
                args[1].cb = true;
                args[1].__preParsed = true;
                return it.apply(ctx, args);
            };
            it.cb.skip = it.skip.cb;
            it.cb.only = it.only.cb;
            inject.cb = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].cb = true;
                args[1].__preParsed = true;
                return inject.apply(ctx, args);
            };
            inject.skip = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].skip = true;
                args[1].__preParsed = true;
                return inject.apply(ctx, args);
            };
            inject.skip.cb = inject.cb.skip = inject.skip;
            before.cb = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].cb = true;
                args[1].__preParsed = true;
                return before.apply(ctx, args);
            };
            before.skip = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].skip = true;
                args[1].__preParsed = true;
                return before.apply(ctx, args);
            };
            before.skip.cb = before.cb.skip = before.skip;
            after.cb = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].cb = true;
                args[1].__preParsed = true;
                return after.apply(ctx, args);
            };
            after.skip = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].skip = true;
                args[1].__preParsed = true;
                return after.apply(ctx, args);
            };
            after.skip.cb = after.cb.skip = after.skip;
            beforeEach.cb = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].cb = true;
                args[1].__preParsed = true;
                return beforeEach.apply(ctx, args);
            };
            beforeEach.skip = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].skip = true;
                args[1].__preParsed = true;
                return beforeEach.apply(ctx, args);
            };
            beforeEach.skip.cb = beforeEach.cb.skip = beforeEach.skip;
            afterEach.cb = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].cb = true;
                args[1].__preParsed = true;
                return afterEach.apply(ctx, args);
            };
            afterEach.skip = function (desc, opts, fn) {
                var args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].skip = true;
                args[1].__preParsed = true;
                return afterEach.apply(ctx, args);
            };
            afterEach.skip.cb = afterEach.cb.skip = afterEach.skip;
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
        freeze_existing_props_1.freezeExistingProps(TestSuite.prototype);
        return freeze_existing_props_1.freezeExistingProps(new TestSuite(data));
    };
    return TestSuiteMaker;
};
