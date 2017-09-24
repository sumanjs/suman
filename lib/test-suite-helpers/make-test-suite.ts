'use strict';

//dts
import {IInjectOpts, IInjectHookCallbackMode, IInjectHookRegularMode, IInjectFn} from "suman-types/dts/inject";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {BeforeHookCallbackMode, BeforeHookRegularMode, IBeforeFn, IBeforeOpts} from "suman-types/dts/before";
import {ITestSuite} from "suman-types/dts/test-suite";
import {ITestSuiteMakerOpts, TTestSuiteMaker} from "suman-types/dts/test-suite-maker";
import {ISuman} from "suman-types/dts/suman";
import {IItOpts, ItFn, ItHookCallbackMode, ItHookRegularMode} from "suman-types/dts/it";
import {IDescribeFn, IDescribeOpts, TDescribeHook} from "suman-types/dts/describe";

import {
  BeforeEachHookCallbackMode, BeforeEachHookRegularMode, IBeforeEachFn,
  IBeforeEachOpts
} from "suman-types/dts/before-each";

import {IAfterEachFn, IAfterEachOpts, TAfterEachHook} from "suman-types/dts/after-each";
import {AfterHookCallbackMode, AfterHookRegularMode, IAfterFn, IAfterOpts} from "suman-types/dts/after";

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
import TestSuiteBase from './test-suite-base-constructor';
import {freezeExistingProps} from 'freeze-existing-props'

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

///////////////////////////////////////////////////////////////////////////////////////////

type ITestSuiteConstructor = (obj: ITestSuiteMakerOpts) => void;

///////////////////////////////////////////////////////////////////////////////////////////////////

const makeRunChild = function (val: any) {
  return function runChild(child: ITestSuite, cb: Function) {
    child._run(val, cb);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeTestSuiteMaker
  = function (suman: ISuman, gracefulExit: Function, blockInjector: Function): TTestSuiteMaker {

  const allDescribeBlocks = suman.allDescribeBlocks;
  const _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);
  const notifyParentThatChildIsComplete = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);

  const TestSuiteMaker: TTestSuiteMaker = function (data: ITestSuiteMakerOpts): ITestSuite {

    let it: ItFn,
      describe: IDescribeFn,
      before: IBeforeFn,
      after: IAfterFn,
      beforeEach: IBeforeEachFn,
      afterEach: IAfterEachFn,
      inject: IInjectFn,
      afterAllParentHooks: Function;

    const TestSuite: ITestSuiteConstructor = function (obj: ITestSuiteMakerOpts): void {   // this fn is a constructor

      this.interface = suman.interface;
      this.desc = this.title = obj.desc;

      this.timeout = function () {
        console.error(' => this.timeout is not implemented yet.');
      };

      this.slow = function () {
        console.error(' => this.slow is not implemented yet.');
      };

      const zuite = this;

      this.resume = function () {
        const args = Array.from(arguments);
        process.nextTick(function () {
          zuite.__resume.apply(zuite, args);
        });
      };

      inject = this.inject = makeInject(suman, zuite);

      before = makeBefore(suman, zuite);
      _interface === 'TDD' ? this.setup = before : this.before = before;

      after = makeAfter(suman, zuite);
      _interface === 'TDD' ? this.teardown = after : this.after = after;

      beforeEach = makeBeforeEach(suman, zuite);
      _interface === 'TDD' ? this.setupTest = beforeEach : this.beforeEach = beforeEach;

      afterEach = makeAfterEach(suman, zuite);
      _interface === 'TDD' ? this.teardownTest = afterEach : this.afterEach = afterEach;

      it = makeIt(suman, zuite);
      _interface === 'TDD' ? this.test = it : this.it = it;

      describe = this.context
        = makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite, notifyParentThatChildIsComplete, blockInjector);
      _interface === 'TDD' ? this.suite = describe : this.describe = describe;

      afterAllParentHooks = this.afterAllParentHooks = makeAfterAllParentHooks(suman, zuite);

      Object.getPrototypeOf(this).getdescribe = function () {
        return describe;
      };

      Object.getPrototypeOf(this).getinject = function () {
        return inject;
      };

      Object.getPrototypeOf(this).getit = function () {
        return it;
      };

      Object.getPrototypeOf(this).getbefore = function () {
        return before;
      };

      Object.getPrototypeOf(this).getafter = function () {
        return after;
      };

      Object.getPrototypeOf(this).getafterEach = function () {
        return afterEach;
      };

      Object.getPrototypeOf(this).getbeforeEach = function () {
        return beforeEach;
      }
    };

    //Note: we hide many properties in the prototype
    TestSuite.prototype = Object.create(new TestSuiteBase(data, suman));

    TestSuite.prototype.testBlockMethodCache = new Map();

    TestSuite.prototype.__bindExtras = function bindExtras() {

      const ctx = suman.ctx = this;

      const getProxyOld = function (val: Function, rule: Object, props?: Array<string>) {

        return new Proxy(val, {
          get: function (target, prop) {

            props = props || [];
            let hasSkip = false;
            let newProps = props.concat(String(prop)).filter(function (v, i, a) {
              if (String(v) === 'skip') {
                hasSkip = true;
              }
              // we use this filter to get a unique list
              return a.indexOf(v) === i;
            });

            if (hasSkip) {
              newProps = ['skip'];
            }

            let fn = function () {

              let args = pragmatik.parse(arguments, rule);

              newProps.forEach(function (p) {
                args[1][p] = true;
              });

              args[1].__preParsed = true;
              return val.apply(ctx, args);
            };

            return getProxyOld(fn, rule, newProps);
          }
        });
      };

      const getProxy = function (method: Function, rule: Object, props?: Array<string>) {

        return new Proxy(method, {
          get: function (target, prop) {

            props = props || [];
            let hasSkip = false;
            let newProps = props.concat(String(prop)).filter(function (v, i, a) {
              if (String(v) === 'skip') {
                hasSkip = true;
              }
              // we use this filter to get a unique list
              return a.indexOf(v) === i;
            });

            if (hasSkip) {
              newProps = ['skip'];
            }

            let cache, cacheId = newProps.join('-');

            let fnCache = ctx.testBlockMethodCache.get(method);
            if (!fnCache) {
              fnCache = {};
              ctx.testBlockMethodCache.set(method, fnCache);
            }

            if (cache = ctx.testBlockMethodCache.get(method)[cacheId]) {
              return cache;
            }

            let fn = function () {

              let args = pragmatik.parse(arguments, rule);

              newProps.forEach(function (p) {
                args[1][p] = true;
              });

              args[1].__preParsed = true;
              return method.apply(ctx, args);
            };

            return fnCache[cacheId] = getProxy(fn, rule, newProps);

          }
        });
      };

      this.describe = getProxy(describe, rules.blockSignature) as IDescribeFn;
      this.it = getProxy(it, rules.testCaseSignature) as ItFn;
      this.inject = getProxy(inject, rules.hookSignature) as IInjectFn;
      this.before = getProxy(before, rules.hookSignature) as IBeforeFn;
      this.beforeEach = getProxy(beforeEach, rules.hookSignature) as IBeforeEachFn;
      this.after = getProxy(after, rules.hookSignature) as IAfterFn;
      this.afterEach = getProxy(afterEach, rules.hookSignature) as IAfterEachFn;

      // describe.delay =
      //   function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      //     let args = pragmatik.parse(arguments, rules.blockSignature);
      //     args[1].delay = true;
      //     args[1].__preParsed = true;
      //     describe.apply(ctx, args);
      //   };
      //
      // describe.skip =
      //   function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      //     let args = pragmatik.parse(arguments, rules.blockSignature);
      //     args[1].skip = true;
      //     args[1].__preParsed = true;
      //     describe.apply(ctx, args);
      //   };
      //
      // describe.only =
      //   function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      //     suman.describeOnlyIsTriggered = true;
      //     let args = pragmatik.parse(arguments, rules.blockSignature);
      //     args[1].only = true;
      //     args[1].__preParsed = true;
      //     describe.apply(ctx, args);
      //   };
      //
      // describe.skip.delay = describe.delay.skip = describe.skip;
      //
      // describe.only.delay = describe.delay.only =
      //   function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      //     suman.describeOnlyIsTriggered = true;
      //     let args = pragmatik.parse(arguments, rules.blockSignature);
      //     args[1].only = true;
      //     args[1].delay = true;
      //     args[1].__preParsed = true;
      //     describe.apply(ctx, args);
      //   };

      // it.skip = function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
      //   let args = pragmatik.parse(arguments, rules.testCaseSignature);
      //   args[1].skip = true;
      //   args[1].__preParsed = true;
      //   return it.apply(ctx, args);
      // };
      //
      // it.only = function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
      //   suman.itOnlyIsTriggered = true;
      //   let args = pragmatik.parse(arguments, rules.testCaseSignature);
      //   args[1].only = true;
      //   args[1].__preParsed = true;
      //   return it.apply(ctx, args);
      // };
      //
      // it.only.cb = function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
      //   suman.itOnlyIsTriggered = true;
      //   let args = pragmatik.parse(arguments, rules.testCaseSignature);
      //   args[1].only = true;
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return it.apply(ctx, args);
      // };
      //
      // it.skip.cb = function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.testCaseSignature);
      //   args[1].skip = true;
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return it.apply(ctx, args);
      // };
      //
      // it.cb = function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.testCaseSignature);
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return it.apply(ctx, args);
      // };
      //
      // it.cb.skip = it.skip.cb;
      // it.cb.only = it.only.cb;

      // inject.cb = function (desc: string, opts: IInjectOpts, fn: IInjectHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return inject.apply(ctx, args);
      // };
      //
      // inject.skip = function (desc: string, opts: IInjectOpts, fn: IInjectHookRegularMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].skip = true;
      //   args[1].__preParsed = true;
      //   return inject.apply(ctx, args);
      // };
      //
      // // to save memory we can make this equivalence since if the hook is skipped
      // // it won't matter if it's callback mode or not :)
      // inject.skip.cb = inject.cb.skip = inject.skip;

      // before.cb = function (desc: string, opts: IBeforeOpts, fn: BeforeHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return before.apply(ctx, args);
      // };
      //
      // before.skip = function (desc: string, opts: IBeforeOpts, fn: BeforeHookRegularMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].skip = true;
      //   args[1].__preParsed = true;
      //   return before.apply(ctx, args);
      // };
      //
      // // to save memory we can make this equivalence since if the hook is skipped
      // // it won't matter if it's callback mode or not :)
      // before.skip.cb = before.cb.skip = before.skip;
      //
      // after.cb = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.skip = function (desc: string, opts: IAfterOpts, fn: AfterHookRegularMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].skip = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // // to save memory we can make this equivalence since if the hook is skipped
      // // it won't matter if it's callback mode or not :)
      // after.skip.cb = after.cb.skip = after.skip;
      //
      // beforeEach.cb = function (desc: string, opts: IBeforeEachOpts, fn: BeforeEachHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return beforeEach.apply(ctx, args);
      // };
      //
      // beforeEach.skip = function (desc: string, opts: IBeforeEachOpts, fn: BeforeEachHookRegularMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].skip = true;
      //   args[1].__preParsed = true;
      //   return beforeEach.apply(ctx, args);
      // };
      //
      // // to save memory we can make this equivalence since if the hook is skipped
      // // it won't matter if it's callback mode or not :)
      // beforeEach.skip.cb = beforeEach.cb.skip = beforeEach.skip;
      //
      // afterEach.cb = function (desc: string, opts: IAfterEachOpts, fn: TAfterEachHook) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return afterEach.apply(ctx, args);
      // };
      //
      // afterEach.skip = function (desc: string, opts: IAfterEachOpts, fn: TAfterEachHook) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].skip = true;
      //   args[1].__preParsed = true;
      //   return afterEach.apply(ctx, args);
      // };
      //
      // // to save memory we can make this equivalence since if the hook is skipped
      // // it won't matter if it's callback mode or not :)
      // afterEach.skip.cb = afterEach.cb.skip = afterEach.skip;
      //
      // after.last = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].last = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.always = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].always = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.cb.always = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].always = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.cb.last = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].last = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.last.cb = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].cb = true;
      //   args[1].last = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.last.always = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].last = true;
      //   args[1].always = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.always.cb = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].always = true;
      //   args[1].cb = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.always.last = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //   let args = pragmatik.parse(arguments, rules.hookSignature);
      //   args[1].last = true;
      //   args[1].always = true;
      //   args[1].__preParsed = true;
      //   return after.apply(ctx, args);
      // };
      //
      // after.cb.last.always =
      //   after.cb.always.last =
      //     after.last.cb.always =
      //       after.last.always.cb =
      //         after.always.cb.last =
      //           after.always.last.cb =
      //             function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
      //               let args = pragmatik.parse(arguments, rules.hookSignature);
      //               args[1].last = true;
      //               args[1].always = true;
      //               args[1].cb = true;
      //               args[1].__preParsed = true;
      //               return after.apply(ctx, args);
      //             };

      /*

      to save memory we can make this equivalence since if the hook is skipped
       it won't matter if it's callback mode or not :)

       */

      // after.skip.cb =
      //   after.cb.skip =
      //     after.last.skip =
      //       after.skip.last =
      //         after.always.skip =
      //           after.skip.always = after.skip;
      //
      // after.skip.cb.last =
      //   after.skip.last.cb =
      //     after.skip.cb.always =
      //       after.skip.always.cb = after.skip;
      //
      // after.skip.cb.last.always =
      //   after.skip.last.cb.always =
      //     after.skip.cb.always.last =
      //       after.skip.always.cb.last = after.skip;

    };

    TestSuite.prototype.__invokeChildren = function (val: any, start: Function) {
      async.eachSeries(this.getChildren(), makeRunChild(val), start);
    };

    TestSuite.prototype.toString = function () {
      return this.constructor + ':' + this.desc;
    };

    TestSuite.prototype.log = function () {
      console.log(' [TESTSUITE LOGGER] => ', ...Array.from(arguments));
    };

    TestSuite.prototype.series = function (cb: Function) {
      if (typeof cb === 'function') {
        cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
      }
      return this;
    };

    TestSuite.prototype.__startSuite = makeStartSuite(suman, gracefulExit,
      handleBeforesAndAfters, notifyParentThatChildIsComplete);

    // freezeExistingProps(TestSuite.prototype);
    // return freezeExistingProps(new TestSuite(data));

    return new TestSuite(data);

  };

  return TestSuiteMaker;

};

