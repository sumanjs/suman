'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {makeIt} from '../test-suite-methods/make-it';
import {makeAfter} from '../test-suite-methods/make-after';
import {makeAfterEach} from '../test-suite-methods/make-after-each';
import {makeBeforeEach} from '../test-suite-methods/make-before-each';
import {makeBefore} from '../test-suite-methods/make-before';
import {makeInject} from '../test-suite-methods/make-inject';
import {makeDescribe} from '../test-suite-methods/make-describe';
import {makeAfterAllParentHooks} from '../test-suite-methods/make-after-all-parent-hooks';
import {IInjectFn} from "suman-types/dts/inject";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IBeforeFn} from "suman-types/dts/before";
import {ItFn, ItHook} from "suman-types/dts/it";
import {IDescribeFn, TDescribeHook} from "suman-types/dts/describe";
import {IBeforeEachFn} from "suman-types/dts/before-each";
import {IAfterEachFn} from "suman-types/dts/after-each";
import {IAfterFn} from "suman-types/dts/after";
import {TBeforeEachHook} from "suman-types/dts/before-each";
import {TAfterEachHook} from "suman-types/dts/after-each";
import {TBeforeHook} from "suman-types/dts/before";
import {TAfterHook} from "suman-types/dts/after";

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
import rules = require('../helpers/handle-varargs');

const {constants} = require('../../config/suman-constants');
import {makeBlockInjector} from '../injection/block-injector';
import {makeCreateInjector} from '../injection/create-injector';

/////////////////////////////////////////////////////////////////////

const possibleProps = <any> {
  
  // note: ALL LOWERCASE HERE
  
  //methods
  describe: true,
  beforeeach: true,
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
        
        return fnCache[cacheId] = getProxy(fn, rule, newProps);
      }
    });
  };
  
};

export class DefineObject {
  
  protected exec: any;
  protected opts: any;
  
  constructor(desc: string, exec: any) {
    this.exec = exec;
    this.opts = {
      '@DefineObjectOpts': true,
      __preParsed: false,
      desc: desc || '(unknown description/title/name)',
    };
  }
  
  inject(): DefineObject {
    return this;
  }
  
  plan(v: number): DefineObject {
    assert(Number.isInteger(v), 'Argument to plan must be an integer.');
    this.opts.planCount = v;
    return this;
  }
  
  desc(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "desc" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  title(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "title" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  name(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "name" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  description(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "description" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  skip(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "skip" must be a boolean.');
    this.opts.skip = v;
    return this;
  }
  
  only(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "only" must be a boolean.');
    this.opts.only = v;
    return this;
  }
  
  parallel(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
    this.opts.parallel = v;
    return this;
  }
  
  series(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
    this.opts.series = v;
    return this;
  }
  
  mode(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "mode" must be a string.');
    this.opts.mode = v;
    return this;
  }
  
  timeout(v: number): DefineObject {
    assert(Number.isInteger(v), 'Timeout value must be an integer.');
    this.opts.timeout = v;
    return this;
  }
  
}


interface IDefineObject {
  new (desc: string, exec: any): DefineObject;
}

export class DefineObjectTestOrHook extends DefineObject {
  
  throws(v: string | RegExp): DefineObject {
    if (typeof v === 'string') {
      v = new RegExp(v);
    }
    else if (!(v instanceof RegExp)) {
      throw new Error('Value for "throws" must be a String or regular expression (RegExp instance).');
    }
    this.opts.throws = v;
    return this;
  }
  
  cb(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "cb" must be a boolean.');
    this.opts.cb = v;
    return this;
  }
  
  events(): DefineObject {
    
    const successEvents = this.opts.successEvents = this.opts.successEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "successEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
      successEvents.push(v);
    });
    
    return this;
  }
  
  successEvents(...args: (string | Array<string>)[]): DefineObject {
    
    const successEvents = this.opts.successEvents = this.opts.successEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "successEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
      successEvents.push(v);
    });
    
    return this;
  }
  
  successEvent(...args: string[]): DefineObject {
    
    const successEvents = this.opts.successEvents = this.opts.successEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "successEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
      successEvents.push(v);
    });
    
    return this;
  }
  
  errorEvents(...args: (Array<string> | string)[]): DefineObject {
    
    const errorEvents = this.opts.errorEvents = this.opts.errorEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "errorEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "errorEvent" must be a string.');
      errorEvents.push(v);
    });
    
    return this;
  }
  
  errorEvent(...args: string[]): DefineObject {
    
    const errorEvents = this.opts.errorEvents = this.opts.errorEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "errorEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "errorEvent" must be a string.');
      errorEvents.push(v);
    });
    
    return this;
  }
  
}

export class DefineObjectAllHook extends DefineObjectTestOrHook {
  
  fatal(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "fatal" must be a boolean.');
    this.opts.fatal = v;
    return this;
  }
  
  first(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
    this.opts.first = v;
    return this;
  }
  
  last(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "last" must be a boolean.');
    this.opts.last = v;
    return this;
  }
  
  always(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "always" must be a boolean.');
    this.opts.always = v;
    return this;
  }
  
  run(fn: TBeforeHook | TAfterHook): DefineObject {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}

export class DefineObjectEachHook extends DefineObjectTestOrHook {
  
  fatal(v: boolean): DefineObjectTestOrHook {
    assert.equal(typeof v, 'boolean', 'Value for "fatal" must be a boolean.');
    this.opts.fatal = v;
    return this;
  }
  
  run(fn: TBeforeEachHook | TAfterEachHook): DefineObjectTestOrHook {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}

export class DefineObjectTestCase extends DefineObjectTestOrHook {
  
  run(fn: ItHook): DefineObjectTestCase {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}

export class DefineObjectContext extends DefineObject {
  
  source(...args: string[]): DefineObjectContext {
    this.opts.sourced = Array.from(arguments).reduce(function (a, b) {
      return a.concat(b);
    }, []);
    return this;
  }
  
  names(...args: string[]): DefineObjectContext {
    this.opts.names = Array.from(arguments).reduce(function (a, b) {
      return a.concat(b);
    }, []);
    return this;
  }
  
  run(fn: TDescribeHook): DefineObjectContext {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}

const addDefine = function (fn: any, Clazz: IDefineObject) {
  
  fn.define = function (desc?: string | Function, f?: Function) {
    
    if (typeof desc === 'function') {
      f = desc;
      desc = null;
    }
    
    debugger;
    
    const defObj = new Clazz(desc as string, fn);
    
    debugger;
    
    if (f) {
      assert(typeof f === 'function', 'Optional argument to define() was expected to be a function.');
      f.call(null, defObj);
    }
    
    return defObj;
  };
  
  return fn;
  
};

export const makeSumanMethods = function (suman: ISuman, TestBlock: TestBlockBase,
                                          gracefulExit: Function, notifyParent: Function): any {
  
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
  const inject: IInjectFn = addDefine(makeInject(suman), DefineObjectTestOrHook);
  const before: IBeforeFn = addDefine(makeBefore(suman), DefineObjectAllHook);
  const after: IAfterFn = addDefine(makeAfter(suman), DefineObjectAllHook);
  const beforeEach: IBeforeEachFn = addDefine(makeBeforeEach(suman), DefineObjectEachHook);
  const afterEach: IAfterEachFn = addDefine(makeAfterEach(suman), DefineObjectEachHook);
  const it: ItFn = addDefine(makeIt(suman), DefineObjectTestCase);
  const afterAllParentHooks = addDefine(makeAfterAllParentHooks(suman), DefineObjectAllHook);
  const describe: IDescribeFn =
    addDefine(makeDescribe(suman, gracefulExit, TestBlock, notifyParent, blockInjector), DefineObjectContext);
  
  /////////////////////////////////////////////////////////////////////////////////////////
  
  const getProxy = makeProxy(suman);
  m.describe = m.context = m.suite = getProxy(describe, rules.blockSignature) as IDescribeFn;
  m.it = m.test = getProxy(it, rules.testCaseSignature) as ItFn;
  m.inject = getProxy(inject, rules.hookSignature) as IInjectFn;
  m.before = m.beforeall = m.setup = getProxy(before, rules.hookSignature) as IBeforeFn;
  m.beforeeach = m.setuptest = getProxy(beforeEach, rules.hookSignature) as IBeforeEachFn;
  m.after = m.afterall = m.teardown = getProxy(after, rules.hookSignature) as IAfterFn;
  m.aftereach = m.teardowntest = getProxy(afterEach, rules.hookSignature) as IAfterEachFn;
  m.afterallparenthooks = getProxy(afterAllParentHooks, rules.hookSignature) as Function;
  
  return createInjector
  
};
