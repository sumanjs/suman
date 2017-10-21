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
var test_suite_1 = require("../symbols/test-suite");
var makeRunChild = function (val) {
    return function runChild(child, cb) {
        child._run(val, cb);
    };
};
exports.makeTestSuite = function (suman, gracefulExit, handleBeforesAndAfters, notifyParent) {
    var startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
    return (function (_super) {
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
            _this.injectedValues = {};
            _this.interface = suman.interface;
            _this.desc = _this.title = obj.desc;
            _this[test_suite_1.TestBlockSymbols.children] = [];
            _this[test_suite_1.TestBlockSymbols.tests] = [];
            _this[test_suite_1.TestBlockSymbols.parallelTests] = [];
            _this[test_suite_1.TestBlockSymbols.befores] = [];
            _this[test_suite_1.TestBlockSymbols.beforeEaches] = [];
            _this[test_suite_1.TestBlockSymbols.afters] = [];
            _this[test_suite_1.TestBlockSymbols.aftersLast] = [];
            _this[test_suite_1.TestBlockSymbols.afterEaches] = [];
            _this[test_suite_1.TestBlockSymbols.injections] = [];
            _this[test_suite_1.TestBlockSymbols.getAfterAllParentHooks] = [];
            return _this;
        }
        TestBlock.prototype.getAfterAllParentHooks = function () {
            return this[test_suite_1.TestBlockSymbols.getAfterAllParentHooks];
        };
        TestBlock.prototype.mergeAfters = function () {
            while (this[test_suite_1.TestBlockSymbols.aftersLast].length > 0) {
                this[test_suite_1.TestBlockSymbols.afters].push(this[test_suite_1.TestBlockSymbols.aftersLast].shift());
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
            return this[test_suite_1.TestBlockSymbols.injections];
        };
        TestBlock.prototype.getChildren = function () {
            return this[test_suite_1.TestBlockSymbols.children];
        };
        TestBlock.prototype.getTests = function () {
            return this[test_suite_1.TestBlockSymbols.tests];
        };
        TestBlock.prototype.getParallelTests = function () {
            return this[test_suite_1.TestBlockSymbols.parallelTests];
        };
        TestBlock.prototype.getBefores = function () {
            return this[test_suite_1.TestBlockSymbols.befores];
        };
        TestBlock.prototype.getBeforeEaches = function () {
            return this[test_suite_1.TestBlockSymbols.beforeEaches];
        };
        TestBlock.prototype.getAftersLast = function () {
            return this[test_suite_1.TestBlockSymbols.aftersLast];
        };
        TestBlock.prototype.getAfters = function () {
            return this[test_suite_1.TestBlockSymbols.afters];
        };
        TestBlock.prototype.getAfterEaches = function () {
            return this[test_suite_1.TestBlockSymbols.afterEaches];
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
    }(test_block_base_1.TestBlockBase));
};
