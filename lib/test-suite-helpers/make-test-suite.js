'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var incrementer_1 = require("../misc/incrementer");
var test_block_base_1 = require("./test-block-base");
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var rules = require('../helpers/handle-varargs');
var constants = require('../../config/suman-constants').constants;
var makeStartSuite = require('./make-start-suite').makeStartSuite;
var makeRunChild = function (val) {
    return function runChild(child, cb) {
        child._run(val, cb);
    };
};
exports.makeTestSuite = function (suman, gracefulExit, handleBeforesAndAfters, notifyParent) {
    var _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    var TestBlock = (function (_super) {
        __extends(TestBlock, _super);
        function TestBlock(obj) {
            var _this = _super.call(this) || this;
            var sumanOpts = _suman.sumanOpts;
            _this.opts = obj.opts;
            _this.testId = incrementer_1.incr();
            _this.isSetupComplete = false;
            var parallel = obj.opts.parallel;
            var mode = obj.opts.mode;
            var fixed = _this.fixed = (_this.opts.fixed || false);
            _this.parallel = (sumanOpts.parallel && !fixed) || (!sumanOpts.series && (parallel === true || mode === 'parallel'));
            _this.skipped = _this.opts.skip || false;
            _this.only = _this.opts.only || false;
            _this.filename = suman.filename;
            _this.childCompletionCount = 0;
            _this.completedChildrenMap = new Map();
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
            var getAfterAllParentHooks = [];
            _this.getAfterAllParentHooks = function () {
                return getAfterAllParentHooks;
            };
            _this.mergeAfters = function () {
                while (aftersLast.length > 0) {
                    afters.push(aftersLast.shift());
                }
            };
            _this.injectedValues = {};
            _this.getInjectedValue = function (key) {
                if (key in this.injectedValues) {
                    return this.injectedValues[key];
                }
                else if (this.parent) {
                    return this.parent.getInjectedValue(key);
                }
            };
            _this.getInjections = function () {
                return injections;
            };
            _this.getChildren = function () {
                return children;
            };
            _this.getTests = function () {
                return tests;
            };
            _this.getParallelTests = function () {
                return parallelTests;
            };
            _this.getTestsParallel = function () {
                return testsParallel;
            };
            _this.getLoopTests = function () {
                return loopTests;
            };
            _this.getBefores = function () {
                return befores;
            };
            _this.getBeforeEaches = function () {
                return beforeEaches;
            };
            _this.getAftersLast = function () {
                return aftersLast;
            };
            _this.getAfters = function () {
                return afters;
            };
            _this.getAfterEaches = function () {
                return afterEaches;
            };
            _this.interface = suman.interface;
            _this.desc = _this.title = obj.desc;
            var zuite = _this;
            _this.resume = function () {
                var args = Array.from(arguments);
                process.nextTick(function () {
                    zuite.__resume.apply(zuite, args);
                });
            };
            return _this;
        }
        return TestBlock;
    }(test_block_base_1.TestBlockBase));
    TestBlock.prototype.toString = function () {
        debugger;
        return 'cheeseburger:' + this.desc;
    };
    TestBlock.prototype.invokeChildren = function (val, start) {
        async.eachSeries(this.getChildren(), makeRunChild(val), start);
    };
    TestBlock.prototype.series = function (cb) {
        if (typeof cb === 'function') {
            cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
        }
        return this;
    };
    TestBlock.prototype.bindExtras = function bindExtras() {
        suman.ctx = this;
    };
    TestBlock.prototype.startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
    return TestBlock;
};
