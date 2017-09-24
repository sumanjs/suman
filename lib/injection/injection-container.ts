'use strict';

//dts
import {ITestSuite} from "suman-types/dts/test-suite";
import {IInjectHookCallbackMode, IInjectHookRegularMode, IInjectOpts} from "suman-types/dts/inject";
import {BeforeHookCallbackMode, BeforeHookRegularMode, IBeforeOpts} from "suman-types/dts/before";
import {ISuman} from "suman-types/dts/suman";
import {IDescribeOpts, TDescribeHook} from "suman-types/dts/describe";
import {IItOpts, ItHookCallbackMode, ItHookRegularMode} from "suman-types/dts/it";
import {AfterHookCallbackMode, AfterHookRegularMode, IAfterOpts} from "suman-types/dts/after";
import {BeforeEachHookCallbackMode, BeforeEachHookRegularMode, IBeforeEachOpts} from "suman-types/dts/before-each";
import {IAfterEachOpts} from "suman-types/dts/after-each";
import {IInjectionDeps} from "suman-types/dts/injection";
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');

//npm
const pragmatik = require('pragmatik');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');

/*///////////////////// what it do //////////////////////////////////////

 this module is responsible for +++synchronously+++ injecting values;
 => values may be procured +asynchronously+ prior to this, but here we
 finish creating the entire arguments array, all synchronously

 //////////////////////////////////////////////////////////////////*/

export const makeInjectionContainer = function (suman: ISuman) {

  const getProxy = function (val: Object, props: Array<string>): any {

    return new Proxy(val, {
      get: function (target, prop) {

        let newProps = props.concat(String(prop));
        let cacheId = newProps.join('-');

        if (suman.testBlockMethodCache[cacheId]) {
          return suman.testBlockMethodCache[cacheId];
        }

        let fn = function () {
          let args = Array.from(arguments);
          const ret = newProps.reduce(function (a, b) {
            return a[b];
          }, _suman.ctx);
          return ret.apply(_suman.ctx, args);
        };

        return suman.testBlockMethodCache[cacheId] = getProxy(fn, newProps);
      }
    });
  };

  return getProxy({}, []);

  const container = {

    before: function () {
      return _suman.ctx.before.apply(_suman.ctx, arguments);
    },

    after: function () {
      return _suman.ctx.after.apply(_suman.ctx, arguments);
    },

    beforeEach: function () {
      return _suman.ctx.beforeEach.apply(_suman.ctx, arguments);
    },

    afterEach: function () {
      return _suman.ctx.afterEach.apply(_suman.ctx, arguments);
    },

    describe: function () {
      return _suman.ctx.describe.apply(_suman.ctx, arguments);
    },

    context: function () {
      return _suman.ctx.context.apply(_suman.ctx, arguments);
    },

    it: function () {
      return _suman.ctx.it.apply(_suman.ctx, arguments);
    },

    inject: function () {
      return _suman.ctx.inject.apply(_suman.ctx, arguments);
    },

    afterAllParentHooks: function () {
      return _suman.ctx.afterAllParentHooks.apply(_suman.ctx, arguments);
    },

  };

  container.describe.delay =
    function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      // let args = pragmatik.parse(arguments, rules.blockSignature);
      // args[1].delay = true;
      // args[1].__preParsed = true;
      return _suman.ctx.describe.delay.apply(_suman.ctx, arguments);
    };

  container.describe.skip =
    function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      // let args = pragmatik.parse(arguments, rules.blockSignature);
      // args[1].skip = true;
      // args[1].__preParsed = true;
      return _suman.ctx.describe.skip.apply(_suman.ctx, arguments);
    };

  container.describe.only =
    function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      // _suman.ctx.describeOnlyIsTriggered = true;
      // let args = pragmatik.parse(arguments, rules.blockSignature);
      // args[1].only = true;
      // args[1].__preParsed = true;
      return _suman.ctx.describe.only.apply(_suman.ctx, arguments);
    };

  container.describe.skip.delay = container.describe.delay.skip = container.describe.skip;

  container.describe.only.delay = container.describe.delay.only =
    function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
      // _suman.ctx.describeOnlyIsTriggered = true;
      // let args = pragmatik.parse(arguments, rules.blockSignature);
      // args[1].only = true;
      // args[1].__preParsed = true;
      _suman.ctx.describe.only.delay.apply(_suman.ctx, arguments);
    };

  container.it.skip = function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
    // let args = pragmatik.parse(arguments, rules.testCaseSignature);
    // args[1].skip = true;
    // args[1].__preParsed = true;
    return _suman.ctx.it.skip.apply(_suman.ctx, arguments);
  };

  container.it.only = function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
    // suman.itOnlyIsTriggered = true; // TODO
    // let args = pragmatik.parse(arguments, rules.testCaseSignature);
    // args[1].only = true;
    // args[1].__preParsed = true;
    return _suman.ctx.it.only.apply(_suman.ctx, arguments);
  };

  container.it.only.cb = function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
    // suman.itOnlyIsTriggered = true; //TODO
    // let args = pragmatik.parse(arguments, rules.testCaseSignature);
    // args[1].only = true;
    // args[1].cb = true;
    // args[1].__preParsed = true;
    return _suman.ctx.it.only.cb.apply(_suman.ctx, arguments);
  };

  container.it.skip.cb = function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
    // let args = pragmatik.parse(arguments, rules.testCaseSignature);
    // args[1].skip = true;
    // args[1].cb = true;
    // args[1].__preParsed = true;
    return _suman.ctx.it.skip.cb.apply(_suman.ctx, arguments);
  };

  container.it.cb = function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
    // let args = pragmatik.parse(arguments, rules.testCaseSignature);
    // args[1].cb = true;
    // args[1].__preParsed = true;
    return _suman.ctx.it.cb.apply(_suman.ctx, arguments);
  };

  container.it.cb.skip = container.it.skip.cb;
  container.it.cb.only = container.it.only.cb;

  container.inject.cb = function (desc: string, opts: IInjectOpts, fn: IInjectHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.inject.apply(this, args);
  };

  container.inject.skip = function (desc: string, opts: IInjectOpts, fn: IInjectHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.inject.apply(this, args);
  };

// to save memory we can make this equivalence since if the hook is skipped
// it won't matter if it's callback mode or not :)
  container.inject.skip.cb = container.inject.cb.skip = container.inject.skip;

  container.before.cb = function (desc: string, opts: IBeforeOpts, fn: BeforeHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.before.apply(this, args);
  };

  container.before.skip = function (desc: string, opts: IBeforeOpts, fn: BeforeHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.before.apply(this, args);
  };

// to save memory we can make this equivalence since if the hook is skipped
// it won't matter if it's callback mode or not :)
  container.before.skip.cb = container.before.cb.skip = container.before.skip;

// first four
  container.after.skip = function (desc: string, opts: IAfterOpts, fn: AfterHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.last = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].last = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.cb = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.always = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].always = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.cb.always = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    // let args = pragmatik.parse(arguments, rules.hookSignature);
    // args[1].cb = true;
    // args[1].always = true;
    // args[1].__preParsed = true;
    return _suman.ctx.after.cb.always.apply(_suman.ctx, arguments);
  };

  container.after.cb.last = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].last = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.last.cb = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].last = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.last.always = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].last = true;
    args[1].always = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.always.cb = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].always = true;
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

  container.after.always.last = function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].last = true;
    args[1].always = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

// after 6

  container.after.cb.last.always =
    container.after.cb.always.last =

      container.after.last.cb.always =
        container.after.last.always.cb =

          container.after.always.cb.last =
            container.after.always.last.cb =

              function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
                let args = pragmatik.parse(arguments, rules.hookSignature);
                args[1].last = true;
                args[1].always = true;
                args[1].cb = true;
                args[1].__preParsed = true;
                return container.after.apply(this, args);
              };

// to save memory we can make this equivalence since if the hook is skipped
// it won't matter if it's callback mode or not :)

  container.after.skip.cb =
    container.after.cb.skip =
      container.after.last.skip =
        container.after.skip.last =
          container.after.always.skip =
            container.after.skip.always = container.after.skip;

  container.after.skip.cb.last =
    container.after.skip.last.cb =
      container.after.skip.cb.always =
        container.after.skip.always.cb = container.after.skip;

  container.after.skip.cb.last.always =
    container.after.skip.last.cb.always =
      container.after.skip.cb.always.last =
        container.after.skip.always.cb.last = container.after.skip;

  container.beforeEach.cb = function (desc: string, opts: IBeforeEachOpts, fn: BeforeEachHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.beforeEach.apply(this, args);
  };

  container.beforeEach.skip = function (desc: string, opts: IBeforeEachOpts, fn: BeforeEachHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.beforeEach.apply(this, args);
  };

// to save memory we can make this equivalence since if the hook is skipped
// it won't matter if it's callback mode or not :)
  container.beforeEach.skip.cb = container.beforeEach.cb.skip = container.beforeEach.skip;

  container.afterEach.cb = function (desc: string, opts: IAfterEachOpts, fn: TAfterEachHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.afterEach.apply(this, args);
  };

  container.afterEach.skip = function (desc: string, opts: IAfterEachOpts, fn: TAfterEachHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.afterEach.apply(this, args);
  };

// to save memory we can make this equivalence since if the hook is skipped
// it won't matter if it's callback mode or not :)
  container.afterEach.skip.cb = container.afterEach.cb.skip = container.afterEach.skip;

  return container;

};
