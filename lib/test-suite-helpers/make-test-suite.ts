'use strict';

//dts
import {IInjectFn} from "suman-types/dts/inject";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IBeforeFn} from "suman-types/dts/before";
import {ITestSuite} from "suman-types/dts/test-suite";
import {ITestSuiteMakerOpts, TTestSuiteMaker} from "suman-types/dts/test-suite-maker";
import {ISuman, Suman} from "../suman";
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
const pragmatik = require('pragmatik');
const _ = require('underscore');
import async = require('async');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {TestSuiteBase} from './test-suite-base-constructor';
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

  const _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);
  // notify parent that child is complete
  const notifyParent = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);

  return function TestSuiteMaker(data: ITestSuiteMakerOpts): ITestSuite {

    const TestSuite: ITestSuiteConstructor = function (obj: ITestSuiteMakerOpts) {

      this.interface = suman.interface;
      this.desc = this.title = obj.desc;
      const zuite = this;
      const ctx = this;

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
      const describe: IDescribeFn = makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite, notifyParent, blockInjector);

      /////////////////////////////////////////////////////////////////////////////////////////

      const getProxy = function (method: Function, rule: Object, props?: Array<string>): Function {

        /*
        NOTE
         this function allows us to dynamically generate functions such as
         => after.last.always.skip();
         this way we only create the functions we need, instead of enumerating them all here.
         this makes for a leaner and more maintenable codebase as well as potentially higher performance.
        */

        return new Proxy(method, {
          get: function (target, prop) {

            props = props || [];
            let hasSkip = false;
            let newProps = props.concat(String(prop)).filter(function (v, i, a) {
              if (String(v) === 'skip') {
                // if skip, none of the other properties matter
                hasSkip = true;
              }
              // we use this filter to get a unique list
              return a.indexOf(v) === i;
            })
            // sort the properties alphabetically so that we need to use fewer number of caches
            .sort();

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

      // _interface === 'TDD' ? this.setup = before : this.before = before;
      this.describe = this.context = this.suite = getProxy(describe, rules.blockSignature) as IDescribeFn;
      this.it = this.test = getProxy(it, rules.testCaseSignature) as ItFn;
      this.inject = getProxy(inject, rules.hookSignature) as IInjectFn;
      this.before = this.setup = getProxy(before, rules.hookSignature) as IBeforeFn;
      this.beforeEach = this.setupTest = getProxy(beforeEach, rules.hookSignature) as IBeforeEachFn;
      this.after = this.teardown = getProxy(after, rules.hookSignature) as IAfterFn;
      this.afterEach = this.teardownTest = getProxy(afterEach, rules.hookSignature) as IAfterEachFn;
      this.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature);

      //////////////////  the following getters are used with the injection container ////////////////////////

      Object.getPrototypeOf(this).get_describe = function () {
        return describe;
      };

      Object.getPrototypeOf(this).get_context = function () {
        return describe;
      };

      Object.getPrototypeOf(this).get_inject = function () {
        return inject;
      };

      Object.getPrototypeOf(this).get_it = function () {
        return it;
      };

      Object.getPrototypeOf(this).get_before = function () {
        return before;
      };

      Object.getPrototypeOf(this).get_after = function () {
        return after;
      };

      Object.getPrototypeOf(this).get_afterEach = function () {
        return afterEach;
      };

      Object.getPrototypeOf(this).get_beforeEach = function () {
        return beforeEach;
      }
    };

    //Note: we hide many properties in the prototype
    TestSuite.prototype = Object.create(new TestSuiteBase(data, suman));
    TestSuite.prototype.testBlockMethodCache = new Map();

    TestSuite.prototype.__bindExtras = function bindExtras() {
      suman.ctx = this;
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

    TestSuite.prototype.__startSuite = makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);

    // freezeExistingProps(TestSuite.prototype);
    // return freezeExistingProps(new TestSuite(data));
    return new TestSuite(data);

  };

};

