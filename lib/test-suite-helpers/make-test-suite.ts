'use strict';

//dts
import {IInjectFn} from "suman-types/dts/inject";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IBeforeFn} from "suman-types/dts/before";
import {ITestSuite, TestSuiteMethodType} from "suman-types/dts/test-suite";
import {ITestSuiteMakerOpts, TTestSuiteMaker} from "suman-types/dts/test-suite-maker";
import {ISuman, Suman} from "../suman";
import {ItFn} from "suman-types/dts/it";
import {IDescribeFn} from "suman-types/dts/describe";
import {IBeforeEachFn} from "suman-types/dts/before-each";
import {IAfterEachFn} from "suman-types/dts/after-each";
import {IAfterFn} from "suman-types/dts/after";
import {incr} from '../misc/incrementer';
import {ITestDataObj} from "suman-types/dts/it";
import {IBeforeObj} from "suman-types/dts/before";
import {IBeforeEachObj} from "suman-types/dts/before-each";
import {IAfterObj} from "suman-types/dts/after";
import {IAFterEachObj} from "suman-types/dts/after-each";
import {IInjectionObj} from "suman-types/dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
const pragmatik = require('pragmatik');
const _ = require('underscore');
import async = require('async');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {makeProxy} from './make-proxy';
const {makeStartSuite} = require('./make-start-suite');
import {makeHandleBeforesAndAfters} from './make-handle-befores-afters';
const {makeNotifyParent} = require('./notify-parent-that-child-is-complete');

// TestSuite methods
import {makeIt} from '../test-suite-methods/make-it';
import {makeAfter} from '../test-suite-methods/make-after';
import {makeAfterEach} from '../test-suite-methods/make-after-each';
import {makeBeforeEach} from '../test-suite-methods/make-before-each';
import {makeBefore} from '../test-suite-methods/make-before';
import {makeInject} from '../test-suite-methods/make-inject';
import {makeDescribe} from '../test-suite-methods/make-describe';
import {makeAfterAllParentHooks} from '../test-suite-methods/make-after-all-parent-hooks';
import symbols from '../helpers/symbols';

///////////////////////////////////////////////////////////////////////////////////////////

type ITestSuiteConstructor = (obj: ITestSuiteMakerOpts) => void;

///////////////////////////////////////////////////////////////////////////////////////////////////

const makeRunChild = function (val: any) {
  return function runChild(child: ITestSuite, cb: Function) {
    child._run(val, cb);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeTestSuite = function (suman: ISuman, gracefulExit: Function, blockInjector: Function): any {

  const _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);
  const notifyParent = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);

  // class TestSuiteBase {
  //   constructor(){
  //     this.startSuite =  makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
  //   }
  // }

  class TestSuite {

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
    completedChildrenMap: Map<ITestSuite, boolean>;

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

    constructor(obj: ITestSuiteMakerOpts) {
      // super();

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

      this.interface = suman.interface;
      this.desc = this.title = obj.desc;
      const zuite = this;

      this.resume = function () {
        const args = Array.from(arguments);
        process.nextTick(function () {
          zuite.__resume.apply(zuite, args);
        });
      };

      /////////////////////////////////////////////////////////////////////////////////////////

      const inject: IInjectFn = makeInject(suman, zuite);
      const before: IBeforeFn = makeBefore(suman, zuite);
      const after: IAfterFn = makeAfter(suman, zuite);
      const beforeEach: IBeforeEachFn = makeBeforeEach(suman, zuite);
      const afterEach: IAfterEachFn = makeAfterEach(suman, zuite);
      const it: ItFn = makeIt(suman, zuite);
      const afterAllParentHooks = makeAfterAllParentHooks(suman, zuite);
      const describe: IDescribeFn = makeDescribe(suman, gracefulExit, TestSuite, zuite, notifyParent, blockInjector);

      /////////////////////////////////////////////////////////////////////////////////////////

      const getProxy = makeProxy(suman, zuite);

      // _interface === 'TDD' ? this.setup = before : this.before = before;
      this.describe = this.context = this.suite = getProxy(describe, rules.blockSignature) as IDescribeFn;
      this.it = this.test = getProxy(it, rules.testCaseSignature) as ItFn;
      this.inject = getProxy(inject, rules.hookSignature) as IInjectFn;
      this.before = this.beforeAll = this.setup = getProxy(before, rules.hookSignature) as IBeforeFn;
      this.beforeEach = this.setupTest = getProxy(beforeEach, rules.hookSignature) as IBeforeEachFn;
      this.after = this.afterAll = this.teardown = getProxy(after, rules.hookSignature) as IAfterFn;
      this.afterEach = this.teardownTest = getProxy(afterEach, rules.hookSignature) as IAfterEachFn;
      this.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature) as Function;

      //////////////////  the following getters are used with the injection container ////////////////////////

      this[symbols.context] = this[symbols.describe] = this[symbols.suite] = function () {
        return describe;
      };

      this.get_inject = function () {
        return inject;
      };

      this[symbols.test] = this[symbols.it] = function () {
        return it;
      };

      // lowercase for a reason
      this[symbols.before] = this[symbols.setup] = this[symbols.beforeall] = function () {
        return before;
      };

      // lowercase for a reason
      this[symbols.after] = this[symbols.afterall] = this[symbols.teardown] = function () {
        return after;
      };

      // lowercase for a reason
      this[symbols.aftereach] = this[symbols.teardowntest] = function () {
        return afterEach;
      };

      // lowercase for a reason
      this[symbols.beforeeach] = this[symbols.setuptest] = function () {
        return beforeEach;
      };

      this.__bindExtras = function bindExtras() {
        suman.ctx = this;
      };

      this.__invokeChildren = function (val: any, start: Function) {
        async.eachSeries(this.getChildren(), makeRunChild(val), start);
      };

      this.testBlockMethodCache = new Map();

      this.toString = function () {
        return 'cheeseburger' + this.desc;
      };

      this.log = console.log.bind(console, 'my test suite =>');

      this.series = function (cb: Function) {
        if (typeof cb === 'function') {
          cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
        }
        return this;
      };

    }

  }

  TestSuite.prototype.startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
  return TestSuite;

};

