'use strict';

//dts
import {IInjectFn} from 'suman-types/dts/inject';
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {IBeforeFn} from 'suman-types/dts/before';
import {ITestSuite, TestSuiteMethodType} from 'suman-types/dts/test-suite';
import {ITestSuiteMakerOpts, TTestSuiteMaker} from 'suman-types/dts/test-suite-maker';
import {ISuman, Suman} from '../suman';
import {ItFn} from 'suman-types/dts/it';
import {IDescribeFn} from 'suman-types/dts/describe';
import {IBeforeEachFn} from 'suman-types/dts/before-each';
import {IAfterEachFn} from 'suman-types/dts/after-each';
import {IAfterFn} from 'suman-types/dts/after';
import {incr} from '../misc/incrementer';
import {ITestDataObj} from 'suman-types/dts/it';
import {IBeforeObj} from 'suman-types/dts/before';
import {IBeforeEachObj} from 'suman-types/dts/before-each';
import {IAfterObj} from 'suman-types/dts/after';
import {IAFterEachObj} from 'suman-types/dts/after-each';
import {IInjectionObj} from 'suman-types/dts/test-suite';
import {TestBlockBase} from './test-block-base';

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
import {freezeExistingProps} from 'freeze-existing-props';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const {makeStartSuite} = require('./make-start-suite');
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

export const makeTestSuite = function (suman: ISuman, gracefulExit: Function,
                                       handleBeforesAndAfters: Function, notifyParent: Function): any {

  const _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);

  return class TestBlock extends TestBlockBase {

    constructor(obj: ITestSuiteMakerOpts) {

      super();

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
      this.completedChildrenMap = new Map();

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
      const getAfterAllParentHooks: Array<IAfterAllParentHooks> = [];

      this.getAfterAllParentHooks = function () {
        return getAfterAllParentHooks;
      };

      this.mergeAfters = function () {
        // mergeAfters is for supporting after.last feature
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

      //////////////////////////////////////////////////////////////////////////////////////

      const zuite = this;

      this.resume = function () {
        const args = Array.from(arguments);
        process.nextTick(function () {
          zuite.__resume.apply(zuite, args);
        });
      };

      // freezeExistingProps(this);

    }

    startSuite() {
      return startSuite.apply(this, arguments);
    }

    toString() {
      return 'cheeseburger:' + this.desc;
    }

    series(cb: Function) {
      if (typeof cb === 'function') {
        cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
      }
      return this;
    }

    invokeChildren(val: any, start: Function) {
      async.eachSeries(this.getChildren(), makeRunChild(val), start);
    }

    bindExtras() {
      return suman.ctx = this;
    }
  }

};

