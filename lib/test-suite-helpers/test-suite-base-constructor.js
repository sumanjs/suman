'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var incrementer_1 = require("../misc/incrementer");
var TestSuiteBase = (function () {
    function TestSuiteBase(obj, suman) {
        var sumanOpts = _suman.sumanOpts;
        this.opts = obj.opts;
        this.testId = incrementer_1.incr();
        this.isSetupComplete = false;
        this.parallel = sumanOpts.parallel ||
            (!sumanOpts.series && (obj.opts.parallel === true || obj.opts.mode === 'parallel'));
        this.skipped = this.opts.skip || false;
        this.only = this.opts.only || false;
        this.filename = suman.filename;
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
    }
    return TestSuiteBase;
}());
exports.TestSuiteBase = TestSuiteBase;
