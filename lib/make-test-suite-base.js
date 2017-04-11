'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman = global.__suman = (global.__suman || {});
const incr = require('./incrementer');

////////////////////////////////////////////////////////////////////////////

module.exports = function (suman) {

  return function TestSuiteBase(obj) {

    this.opts = obj.opts;
    this.testId = incr();
    this.isSetupComplete = false;
    this.parallel = (obj.opts.parallel === true || obj.opts.mode === 'parallel');
    this.skipped = this.opts.skip || false;
    this.only = this.opts.only || false;
    this.filename = this.fileName = suman.fileName || suman.filename;

    const children = [];
    const tests = [];
    const parallelTests = [];
    const testsParallel = [];
    const loopTests = [];
    const befores = [];
    const beforeEaches = [];
    const afters = [];
    const afterEaches = [];
    const injections = [];

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
  }

};
