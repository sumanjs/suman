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
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _ = require('underscore');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var make_start_suite_1 = require("./make-start-suite");
var TestBlockBase = (function () {
    function TestBlockBase() {
    }
    return TestBlockBase;
}());
var makeRunChild = function (val) {
    return function runChild(child, cb) {
        child._run(val, cb);
    };
};
exports.TestBlockSymbols = {
    bindExtras: Symbol('bindExtras'),
    getInjections: Symbol('bindExtras'),
    children: Symbol('children'),
    tests: Symbol('tests'),
    parallelTests: Symbol('parallelTests'),
    befores: Symbol('befores'),
    beforeEaches: Symbol('beforeEaches'),
    afters: Symbol('afters'),
    aftersLast: Symbol('aftersLast'),
    afterEaches: Symbol('afterEaches'),
    injections: Symbol('injections'),
    getAfterAllParentHooks: Symbol('getAfterAllParentHooks'),
};
var id = 1;
var incr = function () {
    return id++;
};
exports.makeTestSuite = function (suman, gracefulExit, handleBeforesAndAfters, notifyParent) {
    var startSuite = make_start_suite_1.makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
    return (function (_super) {
        __extends(TestBlock, _super);
        function TestBlock(obj) {
            var _this = _super.call(this) || this;
            var sumanOpts = _suman.sumanOpts;
            _this.opts = obj.opts;
            _this.testId = incr();
            _this.isSetupComplete = false;
            _this.m = suman.containerProxy;
            var parallel = obj.opts.parallel;
            var mode = obj.opts.mode;
            var fixed = _this.fixed = (_this.opts.fixed || false);
            _this.parallel = (sumanOpts.parallel && !fixed) || (!sumanOpts.series && (parallel === true || mode === 'parallel'));
            _this.skipped = _this.opts.skip || false;
            _this.only = _this.opts.only || false;
            _this.filename = suman.filename;
            _this.childCompletionCount = 0;
            _this.completedChildrenMap = new Map();
            _this.injectedValues = {};
            _this.interface = suman.interface;
            _this.desc = _this.title = obj.desc;
            _this[exports.TestBlockSymbols.children] = [];
            _this[exports.TestBlockSymbols.tests] = [];
            _this[exports.TestBlockSymbols.parallelTests] = [];
            _this[exports.TestBlockSymbols.befores] = [];
            _this[exports.TestBlockSymbols.beforeEaches] = [];
            _this[exports.TestBlockSymbols.afters] = [];
            _this[exports.TestBlockSymbols.aftersLast] = [];
            _this[exports.TestBlockSymbols.afterEaches] = [];
            _this[exports.TestBlockSymbols.injections] = [];
            _this[exports.TestBlockSymbols.getAfterAllParentHooks] = [];
            return _this;
        }
        TestBlock.prototype.set = function (k, v) {
            return this.shared.set(k, v);
        };
        TestBlock.prototype.get = function (k) {
            return this.shared.get(k);
        };
        TestBlock.prototype.getAfterAllParentHooks = function () {
            return this[exports.TestBlockSymbols.getAfterAllParentHooks];
        };
        TestBlock.prototype.mergeAfters = function () {
            while (this[exports.TestBlockSymbols.aftersLast].length > 0) {
                this[exports.TestBlockSymbols.afters].push(this[exports.TestBlockSymbols.aftersLast].shift());
            }
        };
        TestBlock.prototype.getInjectedValue = function (key) {
            if (key in this.injectedValues) {
                return this.injectedValues[key];
            }
            else if (this.parent) {
                return this.parent.getInjectedValue(key);
            }
        };
        TestBlock.prototype.getInjections = function () {
            return this[exports.TestBlockSymbols.injections];
        };
        TestBlock.prototype.getChildren = function () {
            return this[exports.TestBlockSymbols.children];
        };
        TestBlock.prototype.getTests = function () {
            return this[exports.TestBlockSymbols.tests];
        };
        TestBlock.prototype.getParallelTests = function () {
            return this[exports.TestBlockSymbols.parallelTests];
        };
        TestBlock.prototype.getBefores = function () {
            return this[exports.TestBlockSymbols.befores];
        };
        TestBlock.prototype.getBeforeEaches = function () {
            return this[exports.TestBlockSymbols.beforeEaches];
        };
        TestBlock.prototype.getAftersLast = function () {
            return this[exports.TestBlockSymbols.aftersLast];
        };
        TestBlock.prototype.getAfters = function () {
            return this[exports.TestBlockSymbols.afters];
        };
        TestBlock.prototype.getAfterEaches = function () {
            return this[exports.TestBlockSymbols.afterEaches];
        };
        TestBlock.prototype.resume = function () {
            var _this = this;
            var args = Array.from(arguments);
            process.nextTick(function () {
                _this.__resume.apply(_this, args);
            });
        };
        TestBlock.prototype.startSuite = function () {
            return startSuite.apply(this, arguments);
        };
        TestBlock.prototype.toString = function () {
            return 'Suman test block: ' + this.desc;
        };
        TestBlock.prototype.invokeChildren = function (val, start) {
            async.eachSeries(this.getChildren(), makeRunChild(val), start);
        };
        TestBlock.prototype.bindExtras = function () {
            return suman.ctx = this;
        };
        return TestBlock;
    }(TestBlockBase));
};
