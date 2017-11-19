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
import {ItFn} from "suman-types/dts/it";
import {IDescribeFn} from "suman-types/dts/describe";
import {IBeforeEachFn} from "suman-types/dts/before-each";
import {IAfterEachFn} from "suman-types/dts/after-each";
import {IAfterFn} from "suman-types/dts/after";

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

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {makeBlockInjector} from '../injection/block-injector';
import {makeCreateInjector} from '../injection/create-injector';

/////////////////////////////////////////////////////////////////////

const possibleProps = <any> {

  // ALL LOWERCASE HERE

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

  private exec: any;
  private opts: any;

  constructor(exec: any) {
    this.exec = exec;
    this.opts = {
      '@DefineObjectOpts': true,
      __preParsed: false
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

  name(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for name must be a string.');
    this.opts.name = v;
    return this;
  }

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

  fatal(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "fatal" must be a boolean.');
    this.opts.fatal = v;
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

  timeout(v: number): DefineObject {
    assert(Number.isInteger(v), 'Timeout value must be an integer.');
    this.opts.timeout = v;
    return this;
  }

  source(...args: string[]): DefineObject {
    this.opts.sourced = Array.from(arguments).reduce(function (a, b) {
      return a.concat(b);
    }, []);
    return this;
  }

  names(...args: string[]): DefineObject {
    this.opts.names = Array.from(arguments).reduce(function (a, b) {
      return a.concat(b);
    }, []);
    return this;
  }

  run(fn: Function): DefineObject {
    const name = this.opts.name || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }

}

const addDefineOld = function (fn: any) {

  fn.define = function (f: Function) {

    const o = {};
    o.run = fn;

    debugger;
    f(o);

  };

  return fn;

};

const addDefine = function (fn: any) {

  fn.define = function (f: Function) {

    const defObj = new DefineObject(fn);
    assert(typeof f === 'function', 'You must pass a (synchronous) callback as the first argument to define.');
    f.call(null, defObj);

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

  const blockInjector = makeBlockInjector(suman, m);
  const createInjector = makeCreateInjector(suman, m);
  const inject: IInjectFn = makeInject(suman);
  const before: IBeforeFn = addDefine(makeBefore(suman));
  const after: IAfterFn = makeAfter(suman);
  const beforeEach: IBeforeEachFn = makeBeforeEach(suman);
  const afterEach: IAfterEachFn = makeAfterEach(suman);
  const it: ItFn = makeIt(suman);
  const afterAllParentHooks = makeAfterAllParentHooks(suman);
  const describe: IDescribeFn = makeDescribe(suman, gracefulExit, TestBlock, notifyParent, blockInjector);

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
