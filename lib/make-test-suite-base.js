'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var incr = require('./incrementer');
module.exports = function (suman) {
    return function TestSuiteBase(obj) {
        this.opts = obj.opts;
        this.testId = incr();
        this.isSetupComplete = false;
        this.parallel = (obj.opts.parallel === true || obj.opts.mode === 'parallel');
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
        var afterEaches = [];
        var injections = [];
        this.injectedValues = {};
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
        this.getAfters = function () {
            return afters;
        };
        this.getAfterEaches = function () {
            return afterEaches;
        };
    };
};
