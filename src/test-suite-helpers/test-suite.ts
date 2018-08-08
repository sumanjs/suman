'use strict';

//dts
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {ITestBlock, TestSuiteMethods} from 'suman-types/dts/test-suite';
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
import {makeStartSuite} from './make-start-suite';
import {IAfterEachFn, IAfterFn, IBeforeEachFn, IBeforeFn, IDescribeFn, ItFn} from "../s";
import {VamootProxy} from 'vamoot';
import {ISuman} from "../suman";
import {EVCb} from 'suman-types/dts/general';

///////////////////////////////////////////////////////////////////////////////////////////

type ITestSuiteConstructor = (obj: ITestBlockOpts) => void;

const makeRunChild = function (val: any) {
  return function runChild(child: TestBlock, cb: EVCb<any>) {
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

export interface IInjectedValues {
  [key: string]: any
}

export type TestSuiteGetterFn<T> = () => Array<T>;


/////////////////////////////////////////////////////////////////////////////////////////////////////


export interface TestBlockOpts{
  parallel: boolean;
  mode: 'series' | 'serial' | 'parallel',
  fixed: boolean,
  skip: boolean,
  only: boolean,
  series: boolean,
  serial: boolean
}

export interface ITestBlockOpts {
  isTopLevel?: boolean
  desc: string,
  title?: string,
  opts: TestBlockOpts,
  suman: ISuman,
  gracefulExit,
  handleBeforesAndAfters,
  notifyParent,
}


export class TestBlock  implements ITestBlock {

  alreadyHandledAfterAllParentHooks: boolean;
  isDelayed: boolean;
  limit: number;
  supply: object;
  opts: TestBlockOpts;
  testId: number;
  isRootSuite?: boolean;
  childCompletionCount: number;
  allChildBlocksCompleted: boolean;
  isSetupComplete: boolean;
  parallel: boolean;
  skipped: boolean;
  fixed: boolean;
  only: boolean;
  filename: string;
  shared: VamootProxy;
  skippedDueToOnly: boolean;
  completedChildrenMap: Map<TestBlock, boolean>;
  private __suiteSuman: ISuman;
  desc: string;
  title:string;

  _run?: (val: any, cb: EVCb<any>) => void;
  __resume: (val: any) => void;

  bIsFirstArg: boolean;
  __supply: object; // McProxy proxy
  __startSuite: ReturnType<typeof makeStartSuite>;

  ioc: IInjectedValues;
  skippedDueToDescribeOnly?: boolean;
  interface: string;
  injectedValues: IInjectedValues;
  parent: TestBlock;

  // getters

  getTestsParallel: Array<any>;
  getLoopTests: Array<any>;

  getResumeValue?: Function;
  fatal?: Function;
  testBlockMethodCache: Object;

  
  constructor(obj: ITestBlockOpts) {
    
    const sumanOpts = _suman.sumanOpts;
    const {suman, gracefulExit, handleBeforesAndAfters, notifyParent} = obj;
    this.__suiteSuman = suman;
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
    
    this[TestBlockSymbols.children] = [] as Array<TestBlock>;
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

  getInjections() : IInjectedValues {
    return this[TestBlockSymbols.injections];
  }

  getChildren() : Array<TestBlock>{
    return this[TestBlockSymbols.children];
  }

  getTests() : Array<ITestDataObj>{
    return this[TestBlockSymbols.tests];
  }

  getParallelTests() : Array<ITestDataObj>{
    return this[TestBlockSymbols.parallelTests];
  }

  getBefores() : Array<IBeforeObj> {
    return this[TestBlockSymbols.befores];
  }

  getBeforeBlocks() : Array<IBeforeObj> {
    return this[TestBlockSymbols.beforeBlocks];
  }

  getBeforesFirst() : Array<IBeforeObj> {
    return this[TestBlockSymbols.beforesFirst];
  }

  getBeforesLast() : Array<IBeforeObj>{
    return this[TestBlockSymbols.beforesLast];
  }

  getBeforeEaches() : Array<IBeforeEachObj> {
    return this[TestBlockSymbols.beforeEaches];
  }

  getAftersFirst()  : Array<IAfterObj> {
    return this[TestBlockSymbols.aftersFirst];
  }

  getAftersLast() : Array<IAfterObj> {
    return this[TestBlockSymbols.aftersLast];
  }

  getAfters() : Array<IAfterObj> {
    return this[TestBlockSymbols.afters];
  }

  getAfterBlocks() : Array<any>{
    return this[TestBlockSymbols.afterBlocks];
  }

  getAfterEaches(): Array<IAFterEachObj> {
    return this[TestBlockSymbols.afterEaches];
  }

  getAfterAllParentHooks() {
    return this[TestBlockSymbols.getAfterAllParentHooks];
  }

  getAfterBlockList(): Array<IAfterObj> {
    let v = this as TestBlock, ret: Array<IAfterObj> = [];//ret = this.getAfterBlocks();
    while (v = v.parent) {
      v.getAfterBlocks().reverse().forEach(function (z) {
        ret.unshift(z);
      });
    }
    return ret;
  }

  getBeforeBlockList() {
    let v = this as TestBlock, ret = [];//ret = this.getBeforeBlocks();
    while (v = v.parent) {
      v.getBeforeBlocks().reverse().forEach(function (z) {
        ret.unshift(z);
      });
    }
    return ret;
  }

  resume() : void{
    const args = Array.from(arguments);
    const self = this;
    process.nextTick(function () {
      self.__resume.apply(null, args);
    });
  }


  toString() {
    return 'Suman test block: ' + this.desc;
  }

  invokeChildren(val: any, start: EVCb<any>) {
    async.eachSeries(this.getChildren(), makeRunChild(val), start);
  }

  bindExtras() {
    return this.__suiteSuman.ctx = this;
  }


  private mergeBefores() {
    // mergeAfters is for supporting after.last feature

    while (this[TestBlockSymbols.beforesFirst].length > 0) {
      this[TestBlockSymbols.befores].unshift(this[TestBlockSymbols.beforesFirst].pop());
    }

    while (this[TestBlockSymbols.beforesLast].length > 0) {
      this[TestBlockSymbols.befores].push(this[TestBlockSymbols.beforesLast].shift());
    }
  }

  private mergeAfters() {
    // mergeAfters is for supporting after.last feature

    while (this[TestBlockSymbols.aftersFirst].length > 0) {
      this[TestBlockSymbols.afters].unshift(this[TestBlockSymbols.aftersFirst].shift());
    }

    while (this[TestBlockSymbols.aftersLast].length > 0) {
      this[TestBlockSymbols.afters].push(this[TestBlockSymbols.aftersLast].shift());
    }
  }

  getHooks() : TestSuiteMethods {
    return this.__suiteSuman.containerProxy;
  }
  
  
  set(k: any, v: any) : boolean {
    if (arguments.length < 2) {
      throw new Error('Must pass both a key and value to "set" method.');
    }
    return this.shared.set(k, v);
  }
  
  get(k?: any) : any {
    if (arguments.length < 1) {
      return this.shared.getAll();
    }
    return this.shared.get(k);
  }

  getValues(mandatory: string, ...args: Array<string>): Array<any>
  getValues(...args: Array<string>) : Array<any> {
    return args.map(k => {
      return this.shared.get(k);
    });
  }
  
  getMap(...args: Array<string>) : object {
    const ret = {} as any;
    args.forEach(k => {
      ret[k] = this.shared.get(k);
    });
    return ret;
  }
  
  getInjectedValue(key: string) : any {
    if (key in this.injectedValues) {
      return this.injectedValues[key];
    }
    else if (this.parent) {
      return this.parent.getInjectedValue(key);
    }
  }
  
  getInjectedValues(...args: string[]) : Array<any> {
    return args.map(a => {
      return this.getInjectedValue(a);
    });
  }
  
  getInjectedMap(...args: string[]) : object {
    const ret = {} as any;
    args.forEach(a => {
      ret[a] = this.getInjectedValue(a);
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
  
  getSourcedValues(...args: string[]) : Array<any> {
    return args.map(a => {
      return this.getSourcedValue(a);
    });
  }
  
  getSourcedMap(...args: string[]) : object {
    const ret = {} as any;
    args.forEach(a => {
      ret[a] = this.getSourcedValue(a);
    });
    return ret;
  }
  
}


