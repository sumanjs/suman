'use strict';
import {
  IAFterEachObj, IAfterObj, IBeforeEachObj, IBeforeObj, IInjectionObj, ITestDataObj,
  ITestSuite, ITestSuiteBase, ITestSuiteBaseInitObj
} from "../dts/test-suite";

import {ISuman} from "../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as util from 'util';

//project
const _suman = global.__suman = (global.__suman || {});
import {incr} from '../misc/incrementer';

////////////////////////////////////////////////////////////////////////////

export default class TestSuiteBase {

  opts: Object;
  testId: number;
  isSetupComplete: boolean;
  parallel: boolean;
  skipped: boolean;
  only: boolean;
  filename: string;
  mergeAfters: Function;
  getAfters: Function;
  getAfterEaches: Function;
  getBefores: Function;
  getBeforeEaches: Function;
  injectedValues: Object;
  getInjectedValue: Function;
  getInjections: Function;
  getChildren: Function;
  getTests: Function;
  getParallelTests: Function;
  getTestsParallel: Function;
  getLoopTests: Function;
  getAftersLast: Function;


  constructor(obj: ITestSuiteBaseInitObj, suman: ISuman) {

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

    this.getInjectedValue = function (key: string) {
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


}
