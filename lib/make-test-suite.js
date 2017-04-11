'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require('domain');
var util = require('util');
var assert = require('assert');
var fnArgs = require('function-arguments');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require('async');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var rules = require('./helpers/handle-varargs');
var implementationError = require('./helpers/implementation-error');
var constants = require('../config/suman-constants');
var sumanUtils = require('suman-utils');
var freezeExistingProps = require('./freeze-existing');
var originalAcquireDeps = require('./acquire-deps-original');
var startSuite = require('./test-suite-helpers/start-suite');
var makeTestSuiteBase = require('./make-test-suite-base');
var makeHandleBeforesAndAfters = require('./test-suite-helpers/make-handle-befores-afters');
var makeNotifyParent = require('./test-suite-helpers/notify-parent-that-child-is-complete');
var makeIt = require('./test-suite-methods/make-it');
var makeAfter = require('./test-suite-methods/make-after');
var makeAfterEach = require('./test-suite-methods/make-after-each');
var makeBeforeEach = require('./test-suite-methods/make-before-each');
var makeBefore = require('./test-suite-methods/make-before');
var makeInject = require('./test-suite-methods/make-inject');
var makeDescribe = require('./test-suite-methods/make-describe');
function makeRunChild(val) {
    return function runChild(child, cb) {
        child._run(val, cb);
    };
}
function makeTestSuiteMaker(suman, gracefulExit) {
    var allDescribeBlocks = suman.allDescribeBlocks;
    var _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    var TestSuiteBase = makeTestSuiteBase(suman);
    var handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);
    var notifyParentThatChildIsComplete = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);
    var TestSuiteMaker = function (data) {
        var it, describe, before, after, beforeEach, afterEach, inject;
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
            inject = this.inject = makeInject(suman, zuite);
            before = makeBefore(suman, zuite);
            _interface === 'TDD' ? this.setup = before : this.before = before;
            after = makeAfter(suman, zuite);
            _interface === 'TDD' ? this.teardown = after : this.after = after;
            beforeEach = makeBeforeEach(suman, zuite);
            _interface === 'TDD' ? this.setupTest = beforeEach : this.beforeEach = beforeEach;
            afterEach = makeAfterEach(suman, zuite);
            _interface === 'TDD' ? this.teardownTest = afterEach : this.afterEach = afterEach;
            it = makeIt(suman, zuite);
            _interface === 'TDD' ? this.test = it : this.it = it;
            describe = this.context = makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite, notifyParentThatChildIsComplete);
            _interface === 'TDD' ? this.suite = describe : this.describe = describe;
        };
        TestSuite.prototype = Object.create(new TestSuiteBase(data));
        TestSuite.prototype.__bindExtras = function bindExtras() {
            var ctx = this;
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
                    args[1].__preParsed = true;
                    describe.apply(ctx, args);
                };
            it.skip =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.testCaseSignature);
                    args[1].skip = true;
                    args[1].__preParsed = true;
                    return it.apply(ctx, args);
                };
            it.only =
                function (desc, opts, fn) {
                    suman.itOnlyIsTriggered = true;
                    var args = pragmatik.parse(arguments, rules.testCaseSignature);
                    args[1].only = true;
                    args[1].__preParsed = true;
                    return it.apply(ctx, args);
                };
            it.only.cb =
                function (desc, opts, fn) {
                    suman.itOnlyIsTriggered = true;
                    var args = pragmatik.parse(arguments, rules.testCaseSignature);
                    args[1].only = true;
                    args[1].cb = true;
                    args[1].__preParsed = true;
                    return it.apply(ctx, args);
                };
            it.skip.cb =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.testCaseSignature);
                    args[1].skip = true;
                    args[1].cb = true;
                    args[1].__preParsed = true;
                    return it.apply(ctx, args);
                };
            it.cb =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.testCaseSignature);
                    args[1].cb = true;
                    args[1].__preParsed = true;
                    return it.apply(ctx, args);
                };
            it.cb.skip = it.skip.cb;
            it.cb.only = it.only.cb;
            inject.cb =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.hookSignature);
                    args[1].cb = true;
                    args[1].__preParsed = true;
                    return inject.apply(ctx, args);
                };
            inject.skip =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.hookSignature);
                    args[1].skip = true;
                    args[1].__preParsed = true;
                    return inject.apply(ctx, args);
                };
            inject.skip.cb = inject.cb.skip = inject.skip;
            before.cb =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.hookSignature);
                    args[1].cb = true;
                    args[1].__preParsed = true;
                    return before.apply(ctx, args);
                };
            before.skip =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.hookSignature);
                    args[1].skip = true;
                    args[1].__preParsed = true;
                    return before.apply(ctx, args);
                };
            before.skip.cb = before.cb.skip = before.skip;
            after.cb =
                function (desc, opts, fn) {
                    var args = pragmatik.parse(arguments, rules.hookSignature);
                    args[1].cb = true;
                    args[1].__preParsed = true;
                    return after.apply(ctx, args);
                };
            after.skip =
                function (desc, opts, fn) {
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
            var testIds = _.pluck(this.getChildren(), 'testId');
            var children = allDescribeBlocks.filter(function (test) {
                return _.contains(testIds, test.testId);
            });
            async.eachSeries(children, makeRunChild(val), start);
        };
        TestSuite.prototype.toString = function () {
            return this.constructor + ':' + this.desc;
        };
        TestSuite.prototype.log = function () {
            console.log.apply(console, [' [TESTSUITE LOGGER ] => '].concat(Array.from(arguments)));
        };
        TestSuite.prototype.series = function (cb) {
            if (typeof cb === 'function') {
                cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
            }
            return this;
        };
        TestSuite.prototype.__startSuite = startSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParentThatChildIsComplete);
        freezeExistingProps(TestSuite.prototype);
        return freezeExistingProps(new TestSuite(data));
    };
    return TestSuiteMaker;
}
module.exports = makeTestSuiteMaker;
