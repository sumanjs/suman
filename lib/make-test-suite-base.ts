'use strict';
import {
  IAFterEachObj, IAfterObj, IBeforeEachObj, IBeforeObj, IInjectionObj, ITestDataObj,
  ITestSuite, ITestSuiteBaseInitObj
} from "../dts/test-suite";

import {ISuman} from "../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman = global.__suman = (global.__suman || {});
const incr = require('./incrementer');

////////////////////////////////////////////////////////////////////////////

export = function (suman: ISuman) {

  return function TestSuiteBase(obj: ITestSuiteBaseInitObj) {

    this.opts = obj.opts;
    this.testId = incr();
    this.isSetupComplete = false;
    this.parallel = (obj.opts.parallel === true || obj.opts.mode === 'parallel');
    this.skipped = this.opts.skip || false;
    this.only = this.opts.only || false;
    this.filename = suman.filename;

    const children: Array<ITestSuite> = [];
    const tests: Array<ITestDataObj> = [];
    const parallelTests: Array<ITestDataObj> = [];
    const testsParallel: Array<any> = [];
    const loopTests: Array<any> = [];
    const befores: Array<IBeforeObj> = [];
    const beforeEaches: Array<IBeforeEachObj> = [];

    const afters: Array<IAfterObj> = [];
    const aftersLast: Array<IAfterObj> = [];

    const afterEaches: Array<IAFterEachObj> = [];
    const injections: Array<IInjectionObj> = [];

    this.mergeAfters = function () {
      // this is for supporting after.last feature
      while (aftersLast.length > 0) {
        afters.push(aftersLast.shift());
      }
    };

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

};
