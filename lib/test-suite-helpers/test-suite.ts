'use strict';

//dts
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {ITestSuite, TestSuiteMethodType} from 'suman-types/dts/test-suite';
import {ITestSuiteMakerOpts, TTestSuiteMaker} from 'suman-types/dts/test-suite-maker';
import {ITestDataObj} from 'suman-types/dts/it';
import {IBeforeObj} from 'suman-types/dts/before';
import {IBeforeEachObj} from 'suman-types/dts/before-each';
import {IAfterObj} from 'suman-types/dts/after';
import {IAFterEachObj} from 'suman-types/dts/after-each';
import {IInjectionObj} from 'suman-types/dts/inject';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
const pragmatik = require('pragmatik');
import async = require('async');
import {freezeExistingProps} from 'freeze-existing-props';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {makeStartSuite} from './make-start-suite';

///////////////////////////////////////////////////////////////////////////////////////////

type ITestSuiteConstructor = (obj: ITestSuiteMakerOpts) => void;

const makeRunChild = function (val: any) {
  return function runChild(child: ITestSuite, cb: Function) {
    child._run(val, cb);
  }
};

export interface ISumanSymbols {
  [key: string]: symbol
}

export const TestBlockSymbols: ISumanSymbols = {
  bindExtras: Symbol('bindExtras'),
  getInjections: Symbol('bindExtras'),
  children: Symbol('children'),
  tests: Symbol('tests'),
  parallelTests: Symbol('parallelTests'),
  befores: Symbol('befores'),
  beforeBlocks: Symbol('beforeBlocks'),
  beforesFirst: Symbol('beforesFirst'),
  beforesLast: Symbol('beforesLast'),
  beforeEaches: Symbol('beforeEaches'),
  afters: Symbol('afters'),
  afterBlocks: Symbol('afterBlocks'),
  aftersLast: Symbol('aftersLast'),
  aftersFirst: Symbol('aftersFirst'),
  afterEaches: Symbol('afterEaches'),
  injections: Symbol('injections'),
  getAfterAllParentHooks: Symbol('getAfterAllParentHooks'),
};

/////////////////////////////////////////////////////////////////////////////////////////////////////

let id = 1;

const incr = function () {
  // test suite incrementer
  return id++;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export class TestBlock {
  
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
  // protected mergeAfters: Function;
  // protected getAfters: Function;
  // protected getAfterEaches: Function;
  // protected getBefores: Function;
  // protected getBeforeEaches: Function;
  // protected injectedValues: Object;
  // protected getInjectedValue: Function;
  // protected getInjections: Function;
  // protected getChildren: Function;
  // protected getTests: Function;
  // protected getParallelTests: Function;
  // protected getAftersLast: Function;
  
  constructor(obj: ITestSuiteMakerOpts) {
    
    const sumanOpts = _suman.sumanOpts;
    const {suman, gracefulExit, handleBeforesAndAfters, notifyParent} = obj;
    this.__suitesuman = suman;
    this.__startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
    
    this.opts = obj.opts;
    this.testId = incr();
    this.isSetupComplete = false;
    
    // user can access container methods if they need to => b.m.describe()
    // this.m = suman.containerProxy;
    
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
    
    //befores
    this[TestBlockSymbols.befores] = [] as Array<IBeforeObj>;
    this[TestBlockSymbols.beforeBlocks] = [] as Array<any>;
    this[TestBlockSymbols.beforesFirst] = [] as Array<IBeforeObj>;
    this[TestBlockSymbols.beforesLast] = [] as Array<IBeforeObj>;
    
    // afters
    this[TestBlockSymbols.afters] = [] as Array<IAfterObj>;
    this[TestBlockSymbols.afterBlocks] = [] as Array<any>;
    this[TestBlockSymbols.aftersFirst] = [] as Array<IAfterObj>;
    this[TestBlockSymbols.aftersLast] = [] as Array<IAfterObj>;
    
    //eaches
    this[TestBlockSymbols.beforeEaches] = [] as Array<IBeforeEachObj>;
    this[TestBlockSymbols.afterEaches] = [] as Array<IAFterEachObj>;
    
    this[TestBlockSymbols.injections] = [] as Array<IInjectionObj>;
    this[TestBlockSymbols.getAfterAllParentHooks] = [] as Array<IAfterAllParentHooks>;
    
    //////////////////////////////////////////////////////////////////////////////////////
    
    // freezeExistingProps(this);
  }
  
  getHooks() {
    return this.__suitesuman.containerProxy;
  }
  
  set(k: any, v: any) {
    if (arguments.length < 2) {
      throw new Error('Must pass both a key and value to "set" method.');
    }
    return this.shared.set(k, v);
  }
  
  get(k?: any) {
    if (arguments.length < 1) {
      return this.shared.getAll();
    }
    return this.shared.get(k);
  }
  
  getValues(...args: Array<string>) {
    const self = this;
    return args.map(function (k) {
      return self.shared.get(k);
    });
  }
  
  getMap(...args: Array<string>) {
    const self = this;
    const ret = {} as any;
    args.forEach(function (k) {
      ret[k] = self.shared.get(k);
    });
    return ret;
  }
  
  getAfterAllParentHooks() {
    return this[TestBlockSymbols.getAfterAllParentHooks];
  }
  
  mergeBefores() {
    // mergeAfters is for supporting after.last feature
    
    while (this[TestBlockSymbols.beforesFirst].length > 0) {
      this[TestBlockSymbols.befores].unshift(this[TestBlockSymbols.beforesFirst].pop());
    }
    
    while (this[TestBlockSymbols.beforesLast].length > 0) {
      this[TestBlockSymbols.befores].push(this[TestBlockSymbols.beforesLast].shift());
    }
  }
  
  mergeAfters() {
    // mergeAfters is for supporting after.last feature
    
    while (this[TestBlockSymbols.aftersFirst].length > 0) {
      this[TestBlockSymbols.afters].unshift(this[TestBlockSymbols.aftersFirst].shift());
    }
    
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
  
  getInjectedValues(...args: string[]) {
    const self = this;
    return args.map(function (a) {
      return self.getInjectedValue(a);
    });
  }
  
  getInjectedMap(...args: string[]) {
    const self = this;
    const ret = {} as any;
    args.forEach(function (a) {
      ret[a] = self.getInjectedValue(a);
    });
    return ret;
  }
  
  getSourced(): any {
    // get a map of ALL source keys/values
    const ret = {};
    let v = this as TestBlock;
    while (v) {
      let ioc = v.ioc;
      Object.keys(ioc).forEach(function (k) {
        if (!(k in ret)) {
          ret[k] = ioc[k];
        }
      });
      v = this.parent;
    }
    return ret;
  }
  
  getSourcedValue(v: string): any {
    if (v in this.ioc) {
      return this.ioc[v];
    }
    else if (this.parent) {
      return this.parent.getSourcedValue(v);
    }
  }
  
  getSourcedValues(...args: string[]) {
    const self = this;
    return args.map(function (a) {
      return self.getSourcedValue(a);
    });
  }
  
  getSourcedMap(...args: string[]) {
    const self = this;
    const ret = {} as any;
    args.forEach(function (a) {
      ret[a] = self.getSourcedValue(a);
    });
    return ret;
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
  
  getBeforeBlocks() {
    return this[TestBlockSymbols.beforeBlocks];
  }
  
  getBeforesFirst() {
    return this[TestBlockSymbols.beforesFirst];
  }
  
  getBeforesLast() {
    return this[TestBlockSymbols.beforesLast];
  }
  
  getBeforeEaches() {
    return this[TestBlockSymbols.beforeEaches];
  }
  
  getAftersFirst() {
    return this[TestBlockSymbols.aftersFirst];
  }
  
  getAftersLast() {
    return this[TestBlockSymbols.aftersLast];
  }
  
  getAfters() {
    return this[TestBlockSymbols.afters];
  }
  
  getAfterBlocks() {
    return this[TestBlockSymbols.afterBlocks];
  }
  
  getAfterEaches() {
    return this[TestBlockSymbols.afterEaches];
  }
  
  getAfterBlockList(): Array<IAfterObj> {
    let v = this, ret: Array<IAfterObj> = [];//ret = this.getAfterBlocks();
    while (v = v.parent) {
      v.getAfterBlocks().reverse().forEach(function (z) {
        ret.unshift(z);
      });
    }
    return ret;
  }
  
  getBeforeBlockList() {
    let v = this, ret = [];//ret = this.getBeforeBlocks();
    while (v = v.parent) {
      v.getBeforeBlocks().reverse().forEach(function (z) {
        ret.unshift(z);
      });
    }
    return ret;
  }
  
  resume() {
    const args = Array.from(arguments);
    const self = this;
    process.nextTick(function () {
      self.__resume.apply(null, args);
    });
  }
  
  startSuite() {
    return this.__startSuite.apply(this, arguments);
  }
  
  toString() {
    return 'Suman test block: ' + this.desc;
  }
  
  invokeChildren(val: any, start: Function) {
    async.eachSeries(this.getChildren(), makeRunChild(val), start);
  }
  
  bindExtras() {
    return this.__suitesuman.ctx = this;
  }
}


