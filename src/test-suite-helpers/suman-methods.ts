'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {IInjectFn} from "suman-types/dts/inject";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IBeforeFn} from "suman-types/dts/before";
import {ItFn, ItHook} from "suman-types/dts/it";
import {IDescribeFn, TDescribeHook} from "suman-types/dts/describe";
import {IBeforeEachFn} from "suman-types/dts/before-each";
import {IAfterEachFn} from "suman-types/dts/after-each";
import {IAfterFn} from "suman-types/dts/after";
import {
  DefineObject,
  DefineObjectAllHook, DefineObjectContext, DefineObjectEachHook, DefineObjectTestCase,
  DefineObjectTestOrHook, IDefineObject, DefineOptionsInjectHook
} from "./define-options-classes";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
import su = require('suman-utils');
const pragmatik = require('pragmatik');
import _ = require('lodash');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {makeAfterAllParentHooks} from '../test-suite-methods/make-after-all-parent-hooks';
import rules = require('../helpers/handle-varargs');
import {constants} from '../config/suman-constants';
import {makeBlockInjector} from '../injection/block-injector';
import {makeCreateInjector} from '../injection/create-injector';
import {makeIt} from '../test-suite-methods/make-it';
import {makeAfter} from '../test-suite-methods/make-after';
import {makeAfterEach} from '../test-suite-methods/make-after-each';
import {makeBeforeEach} from '../test-suite-methods/make-before-each';
import {makeBefore} from '../test-suite-methods/make-before';
import {makeInject} from '../test-suite-methods/make-inject';
import {makeDescribe} from '../test-suite-methods/make-describe';
import {makeBeforeBlock} from "../test-suite-methods/make-before-block";
import {makeAfterBlock} from "../test-suite-methods/make-after-block";

/////////////////////////////////////////////////////////////////////

const possibleProps = <any> {
  
  // note: ALL LOWERCASE HERE
  
  //methods
  describe: true,
  beforeeach: true,
  beforeeachblock: true,
  aftereachblock: true,
  aftereach: true,
  beforeall: true,
  afterall: true,
  after: true,
  before: true,
  context: true,
  it: true,
  test: true,
  setuptest: true,
  teardowntest: true,
  setup: true,
  teardown: true,
  
  // options
  events: true,
  errorevents: true,
  successevents: true,
  skip: true,
  retries: true,
  fatal: true,
  parallel: true,
  series: true,
  cb: true,
  only: true,
  plan: true,
  throws: true,
  timeout: true,
  always: true,
  last: true,
  __preparsed: true
  
};

const makeProxy = function (suman: ISuman): Function {
  
  return function getProxy(method: Function, rule: Object, props?: Array<string>): Function {
    
    /*
    NOTE
     this function allows us to dynamically generate functions such as
     => after.last.always.skip();
     this way we only create the functions we need, instead of enumerating them all here.
     this makes for a leaner and more maintenable codebase as well as higher performance.
    */
    
    ///////////////////////////////////////////////////////
    
    return new Proxy(method, {
      get: function (target, prop) {
        
        if (typeof prop === 'symbol') {
          return Reflect.get.apply(Reflect, arguments);
        }
        
        props = props || [];
        
        if (prop === 'define') {
          // we don't need to bind define to target, since it uses a closure
          return target.define;
        }
        
        let hasSkip = false;
        let newProps = props.concat(String(prop))
        .map(v => String(v).toLowerCase()) // we map to lowercase first, so we can use indexOf afterwards
        .filter(function (v, i, a) {
          if (v === 'skip' || v === 'skipped') {  // if skip, none of the other properties matter
            hasSkip = true;
          }
          return a.indexOf(v) === i;  // we use this filter to get a unique list
        })
        // sort the properties alphabetically so that we need to use fewer number of caches
        .sort();
        
        if (hasSkip) {
          // if any of the props are "skip" then we can reduce it to just "skip"
          newProps = ['skip'];
        }
        
        let cache, cacheId = newProps.join('-');
        
        let fnCache = suman.testBlockMethodCache.get(method);
        if (!fnCache) {
          fnCache = {};
          suman.testBlockMethodCache.set(method, fnCache);
        }
        
        if (cache = suman.testBlockMethodCache.get(method)[cacheId]) {
          return cache;
        }
        
        let fn = function () {
          
          let args = pragmatik.parse(arguments, rule);
          
          newProps.forEach(function (p) {
            args[1][p] = true;
          });
          
          args[1].__preParsed = true;
          return method.apply(null, args);
        };
        
        fn.define = target.define;
        
        // if(fn.define.props){
        //   throw new Error('Props property is already defined, you may have called something asynchronously.');
        // }
        
        fn.define.props = newProps;
        
        return fnCache[cacheId] = getProxy(fn, rule, newProps);
      }
    });
  };
  
};

const addDefine = function (fn: any, Clazz: typeof DefineObject) {
  
  fn.define = function (desc?: string | Function, f?: Function) {
    
    if (typeof desc === 'function') {
      f = desc;
      desc = null;
    }
    
    const defObj = new Clazz(desc as string, fn);
    
    if (fn.define.props) {
      
      fn.define.props.forEach(function (p) {
        defObj.opts[p] = true;
      });
      
      delete fn.define.props;
    }
    
    if (f) {
      assert(typeof f === 'function', 'Optional argument to define() was expected to be a function.');
      f.call(null, defObj);
    }
    
    return defObj;
  };
  
  return fn;
  
};

export const makeSumanMethods = (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function, notifyParent: Function) => {
  
  /*

     NOTE:

   this function allows us to dynamically generate functions such as
   => after.last.always.skip();
   this way we only create the functions we need, instead of enumerating them all here.
   this makes for a leaner and more maintenable codebase as well as higher performance.

  */
  
  const m = {} as any;
  suman.containerProxy = m;
  
  // injectors
  const blockInjector = makeBlockInjector(suman, m);
  const createInjector = makeCreateInjector(suman, m);
  
  // "methods"
  const inject: IInjectFn = addDefine(makeInject(suman), DefineOptionsInjectHook);
  const before: IBeforeFn = addDefine(makeBefore(suman), DefineObjectAllHook);
  const after: IAfterFn = addDefine(makeAfter(suman), DefineObjectAllHook);
  const beforeEachBlock: IBeforeFn = addDefine(makeBeforeBlock(suman), DefineObjectAllHook);
  const afterEachBlock: IAfterFn = addDefine(makeAfterBlock(suman), DefineObjectAllHook);
  const beforeEach: IBeforeEachFn = addDefine(makeBeforeEach(suman), DefineObjectEachHook);
  const afterEach: IAfterEachFn = addDefine(makeAfterEach(suman), DefineObjectEachHook);
  const it: ItFn = addDefine(makeIt(suman), DefineObjectTestCase);
  const afterAllParentHooks = addDefine(makeAfterAllParentHooks(suman), DefineObjectAllHook);
  const describe: IDescribeFn = addDefine(makeDescribe(suman, gracefulExit, notifyParent, blockInjector, handleBeforesAndAfters), DefineObjectContext);
  
  /////////////////////////////////////////////////////////////////////////////////////////
  
  const getProxy = makeProxy(suman);
  m.describe = m.context = m.suite = getProxy(describe, rules.blockSignature) as IDescribeFn;
  
  m.it = m.test = getProxy(it, rules.testCaseSignature) as ItFn;
  
  m.inject = getProxy(inject, rules.hookSignature) as IInjectFn;
  
  m.before = m.beforeall = m.setup = getProxy(before, rules.hookSignature) as IBeforeFn;
  m.beforeeach = m.beforeEach = m.setupTest = m.setuptest = getProxy(beforeEach, rules.hookSignature) as IBeforeEachFn;
  
  m.after = m.afterAll = m.afterall = m.teardown = m.tearDown = getProxy(after, rules.hookSignature) as IAfterFn;
  m.aftereach = m.afterEach = m.tearDownTest = m.teardownTest = m.teardowntest = getProxy(afterEach, rules.hookSignature) as IAfterEachFn;
  
  m.afterallparenthooks = m.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature) as Function;
  m.beforeeachblock = m.beforeEachBlock = m.beforeeachchild = m.beforeEachChild = getProxy(beforeEachBlock, rules.hookSignature) as Function;
  m.aftereachblock = m.afterEachBlock = m.aftereachchild = m.afterEachChild = getProxy(afterEachBlock, rules.hookSignature) as Function;
  
  return createInjector;
  
};
