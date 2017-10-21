'use strict';

//dts
import {IInjectFn} from 'suman-types/dts/inject';
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {IBeforeFn} from 'suman-types/dts/before';
import {ITestSuite, TestSuiteMethodType} from 'suman-types/dts/test-suite';
import {ITestSuiteMakerOpts, TTestSuiteMaker} from 'suman-types/dts/test-suite-maker';
import {ISuman, Suman} from '../suman';
import {ITestDataObj} from 'suman-types/dts/it';
import {IBeforeObj} from 'suman-types/dts/before';
import {IBeforeEachObj} from 'suman-types/dts/before-each';
import {IAfterObj} from 'suman-types/dts/after';
import {IAFterEachObj} from 'suman-types/dts/after-each';
import {IInjectionObj} from 'suman-types/dts/test-suite';

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
import rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {makeStartSuite} from './make-start-suite';


///////////////////////////////////////////////////////////////////////////////////////////

type ITestSuiteConstructor = (obj: ITestSuiteMakerOpts) => void;


class TestBlockBase {
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
  parent?: ITestSuite;

  describe: Function;
  context: Function;
  suite: Function;
  before: Function;
  beforeAll: Function;
  beforeEach: Function;
  after: Function;
  afterAll: Function;
  afterEach: Function;
  it: Function;
  test: Function;

  testBlockMethodCache: Object;

  // protected
  protected mergeAfters: Function;
  protected getAfters: Function;
  protected getAfterEaches: Function;
  protected getBefores: Function;
  protected getBeforeEaches: Function;
  protected injectedValues: Object;
  protected getInjectedValue: Function;
  protected getInjections: Function;
  protected getChildren: Function;
  protected getTests: Function;
  protected getParallelTests: Function;
  protected getAftersLast: Function;
}


const makeRunChild = function (val: any) {
  return function runChild(child: ITestSuite, cb: Function) {
    child._run(val, cb);
  }
};


export interface ISumanSymbols {
  [key: string]: symbol
}

export const TestBlockSymbols : ISumanSymbols = {

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

/////////////////////////////////////////////////////////////////////////////////////////////////////

let id = 1;

const incr = function (){
  // test suite incrementer
  return id++;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeTestSuite = function (suman: ISuman, gracefulExit: Function,
                                       handleBeforesAndAfters: Function, notifyParent: Function): any {

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
      this.injectedValues = {};
      this.interface = suman.interface;
      this.desc = this.title = obj.desc;

      this[TestBlockSymbols.children] = [] as Array<ITestSuite>;
      this[TestBlockSymbols.tests] = [] as Array<ITestDataObj>;
      this[TestBlockSymbols.parallelTests] = [] as Array<ITestDataObj>;
      this[TestBlockSymbols.befores] = [] as Array<IBeforeObj>;
      this[TestBlockSymbols.beforeEaches] = [] as Array<IBeforeEachObj>;
      this[TestBlockSymbols.afters] = [] as Array<IAfterObj>;
      this[TestBlockSymbols.aftersLast] = [] as Array<IAfterObj>;
      this[TestBlockSymbols.afterEaches] = [] as Array<IAFterEachObj>;
      this[TestBlockSymbols.injections] = [] as Array<IInjectionObj>;
      this[TestBlockSymbols.getAfterAllParentHooks] = [] as Array<IAfterAllParentHooks>;

      //////////////////////////////////////////////////////////////////////////////////////

      // freezeExistingProps(this);

    }

    getAfterAllParentHooks() {
      return this[TestBlockSymbols.getAfterAllParentHooks];
    }

    mergeAfters() {
      // mergeAfters is for supporting after.last feature
      while (this[TestBlockSymbols.aftersLast].length > 0) {
        this[TestBlockSymbols.afters].push(this[TestBlockSymbols.aftersLast].shift());
      }
    }

    getInjectedValue(key: string) {
      if (key in this.injectedValues) {
        return this.injectedValues[key];
      }
      else if (this.parent) {
        return this.parent.getInjectedValue(key);
      }
    }

    getInjections() {
      return this[TestBlockSymbols.injections];
    }

    getChildren() {
      return this[TestBlockSymbols.children];
    }

    getTests() {
      return this[TestBlockSymbols.tests];
    }

    getParallelTests() {
      return this[TestBlockSymbols.parallelTests];
    }

    getBefores() {
      return this[TestBlockSymbols.befores];
    }

    getBeforeEaches() {
      return this[TestBlockSymbols.beforeEaches];
    }

    getAftersLast() {
      return this[TestBlockSymbols.aftersLast];
    }

    getAfters() {
      return this[TestBlockSymbols.afters];
    }

    getAfterEaches() {
      return this[TestBlockSymbols.afterEaches];
    }

    resume() {
      const args = Array.from(arguments);
      process.nextTick(() => {
        this.__resume.apply(this, args);
      });
    }

    startSuite() {
      return startSuite.apply(this, arguments);
    }

    toString() {
      return 'Suman test block: ' + this.desc;
    }

    invokeChildren(val: any, start: Function) {
      async.eachSeries(this.getChildren(), makeRunChild(val), start);
    }

    bindExtras() {
      return suman.ctx = this;
    }
  }

};

