'use strict';

//dts
import {
  IInjectionObj, ITestSuite, ITestSuiteBase, ITestSuiteBaseInitObj
} from "suman-types/dts/test-suite";

import {IGlobalSumanObj} from "suman-types/dts/global";
import {ISuman, Suman} from "../suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
import {incr} from '../misc/incrementer';
import {ITestDataObj} from "suman-types/dts/it";
import {IBeforeObj} from "suman-types/dts/before";
import {IBeforeEachObj} from "suman-types/dts/before-each";
import {IAfterObj} from "suman-types/dts/after";
import {IAFterEachObj} from "suman-types/dts/after-each";



////////////////////////////////////////////////////////////////////////////

export class TestSuiteBase {

  // public
  opts: Object;
  testId: number;
  childCompletionCount: number;
  allChildBlocksCompleted: boolean;
  isSetupComplete: boolean;
  parallel: boolean;
  skipped: boolean;
  fixed: boolean;
  only: boolean;
  filename: string;
  getAfterAllParentHooks: Function;
  completedChildrenMap: Map<ITestSuite,boolean>;

  // private
  private mergeAfters: Function;
  private getAfters: Function;
  private getAfterEaches: Function;
  private getBefores: Function;
  private getBeforeEaches: Function;
  private injectedValues: Object;
  private getInjectedValue: Function;
  private getInjections: Function;
  private getChildren: Function;
  private getTests: Function;
  private getParallelTests: Function;
  private getTestsParallel: Function;
  private getLoopTests: Function;
  private getAftersLast: Function;

  /////////////////////////////////////////

  constructor(obj: ITestSuiteBaseInitObj, suman: ISuman) {

    const sumanOpts = _suman.sumanOpts;

    this.opts = obj.opts;
    this.testId = incr();
    this.isSetupComplete = false;
    let parallel = obj.opts.parallel;
    let mode = obj.opts.mode;
    let fixed = this.fixed = (this.opts.fixed || false);
    this.parallel = (sumanOpts.parallel && !fixed) || (!sumanOpts.series && (parallel === true || mode === 'parallel'));
    this.skipped = this.opts.skip || false;
    this.only = this.opts.only || false;
    this.filename = suman.filename;
    this.childCompletionCount = 0;

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


    this.completedChildrenMap = new Map();

    const getAfterAllParentHooks: Array<IAfterAllParentHooks> = [];

    this.getAfterAllParentHooks = function () {
      return getAfterAllParentHooks;
    };

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
