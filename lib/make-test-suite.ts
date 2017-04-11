'use strict';
// important note: use strict mode so that errors get thrown if properties are modified after the fact

//dts
import {IInjectOpts, IInjectHookCallbackMode, IInjectHookRegularMode, IInjectFn} from "../dts/inject";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const domain = require('domain');
const util = require('util');
const assert = require('assert');

//npm
const fnArgs = require('function-arguments');
const pragmatik = require('pragmatik');
const _ = require('underscore');
const async = require('async');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const rules = require('./helpers/handle-varargs');
const implementationError = require('./helpers/implementation-error');
const constants = require('../config/suman-constants');
const sumanUtils = require('suman-utils');
const freezeExistingProps = require('./freeze-existing');
const originalAcquireDeps = require('./acquire-deps-original');
const startSuite = require('./test-suite-helpers/start-suite');
const makeTestSuiteBase = require('./make-test-suite-base');
const makeHandleBeforesAndAfters = require('./test-suite-helpers/make-handle-befores-afters');
const makeNotifyParent = require('./test-suite-helpers/notify-parent-that-child-is-complete');

// TestSuite methods
const makeIt = require('./test-suite-methods/make-it');
const makeAfter = require('./test-suite-methods/make-after');
const makeAfterEach = require('./test-suite-methods/make-after-each');
const makeBeforeEach = require('./test-suite-methods/make-before-each');
const makeBefore = require('./test-suite-methods/make-before');
const makeInject = require('./test-suite-methods/make-inject');
const makeDescribe = require('./test-suite-methods/make-describe');

///////////////////////////////////////////////////////////////////////////////////////////

function makeRunChild(val: any) {
  return function runChild(child: ITestSuite, cb: Function) {
    child._run(val, cb);
  }
}


function makeTestSuiteMaker(suman: ISuman, gracefulExit: Function): TTestSuiteMaker {

  const allDescribeBlocks = suman.allDescribeBlocks;
  const _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const TestSuiteBase = makeTestSuiteBase(suman);
  const handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);
  const notifyParentThatChildIsComplete = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);

  const TestSuiteMaker: TTestSuiteMaker = function (data: ITestSuiteMakerOpts): ITestSuite {

    let it: ItFn,
      describe: IDescribeFn,
      before: IBeforeFn,
      after: IAfterFn,
      beforeEach: IBeforeEachFn,
      afterEach: IAfterEachFn,
      inject: IInjectFn;


    const TestSuite: ITestSuite = function (obj: ITestSuiteMakerOpts) {   // this fn is a constructor

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

      describe = this.context = makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite, notifyParentThatChildIsComplete);
      _interface === 'TDD' ? this.suite = describe : this.describe = describe;

    };

    //Note: we hide many properties in the prototype

    TestSuite.prototype = Object.create(new TestSuiteBase(data));

    TestSuite.prototype.__bindExtras = function bindExtras() {

      const ctx = this;

      describe.delay =
        function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
          let args = pragmatik.parse(arguments, rules.blockSignature);
          args[1].delay = true;
          args[1].__preParsed = true;
          describe.apply(ctx, args);
        };

      describe.skip =
        function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
          let args = pragmatik.parse(arguments, rules.blockSignature);
          args[1].skip = true;
          args[1].__preParsed = true;
          describe.apply(ctx, args);
        };

      describe.only =
        function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
          suman.describeOnlyIsTriggered = true;
          let args = pragmatik.parse(arguments, rules.blockSignature);
          args[1].only = true;
          args[1].__preParsed = true;
          describe.apply(ctx, args);
        };


      describe.skip.delay = describe.delay.skip = describe.skip;

      describe.only.delay = describe.delay.only =
        function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
          suman.describeOnlyIsTriggered = true;
          let args = pragmatik.parse(arguments, rules.blockSignature);
          args[1].only = true;
          args[1].__preParsed = true;
          describe.apply(ctx, args);
        };


      it.skip =
        function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
          let args = pragmatik.parse(arguments, rules.testCaseSignature);
          args[1].skip = true;
          args[1].__preParsed = true;
          return it.apply(ctx, args);
        };

      it.only =
        function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
          suman.itOnlyIsTriggered = true;
          let args = pragmatik.parse(arguments, rules.testCaseSignature);
          args[1].only = true;
          args[1].__preParsed = true;
          return it.apply(ctx, args);
        };

      it.only.cb =
        function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
          suman.itOnlyIsTriggered = true;
          let args = pragmatik.parse(arguments, rules.testCaseSignature);
          args[1].only = true;
          args[1].cb = true;
          args[1].__preParsed = true;
          return it.apply(ctx, args);
        };

      it.skip.cb =
        function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
          let args = pragmatik.parse(arguments, rules.testCaseSignature);
          args[1].skip = true;
          args[1].cb = true;
          args[1].__preParsed = true;
          return it.apply(ctx, args);
        };

      it.cb =
        function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
          let args = pragmatik.parse(arguments, rules.testCaseSignature);
          args[1].cb = true;
          args[1].__preParsed = true;
          return it.apply(ctx, args);
        };

      it.cb.skip = it.skip.cb;
      it.cb.only = it.only.cb;

      inject.cb =
        function (desc: string, opts: IInjectOpts, fn: IInjectHookCallbackMode) {
          let args = pragmatik.parse(arguments, rules.hookSignature);
          args[1].cb = true;
          args[1].__preParsed = true;
          return inject.apply(ctx, args);
        };

      inject.skip =
        function (desc: string, opts: IInjectOpts, fn: IInjectHookRegularMode) {
          let args = pragmatik.parse(arguments, rules.hookSignature);
          args[1].skip = true;
          args[1].__preParsed = true;
          return inject.apply(ctx, args);
        };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      inject.skip.cb = inject.cb.skip = inject.skip;

      before.cb =
        function (desc: string, opts: IBeforeOpts, fn: BeforeHookCallbackMode) {
          let args = pragmatik.parse(arguments, rules.hookSignature);
          args[1].cb = true;
          args[1].__preParsed = true;
          return before.apply(ctx, args);
        };

      before.skip =
        function (desc: string, opts: IBeforeOpts, fn: BeforeHookRegularMode) {
          let args = pragmatik.parse(arguments, rules.hookSignature);
          args[1].skip = true;
          args[1].__preParsed = true;
          return before.apply(ctx, args);
        };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      before.skip.cb = before.cb.skip = before.skip;

      after.cb =
        function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
          let args = pragmatik.parse(arguments, rules.hookSignature);
          args[1].cb = true;
          args[1].__preParsed = true;
          return after.apply(ctx, args);
        };

      after.skip =
        function (desc: string, opts: IAfterOpts, fn: AfterHookRegularMode) {
          let args = pragmatik.parse(arguments, rules.hookSignature);
          args[1].skip = true;
          args[1].__preParsed = true;
          return after.apply(ctx, args);
        };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      after.skip.cb = after.cb.skip = after.skip;

      beforeEach.cb = function (desc: string, opts: IBeforeEachOpts, fn: BeforeEachHookCallbackMode) {
        let args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return beforeEach.apply(ctx, args);
      };

      beforeEach.skip = function (desc: string, opts: IBeforeEachOpts, fn: BeforeEachHookRegularMode) {
        let args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return beforeEach.apply(ctx, args);
      };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      beforeEach.skip.cb = beforeEach.cb.skip = beforeEach.skip;

      afterEach.cb = function (desc: string, opts: IAfterEachOpts, fn: AfterEachHookCallbackMode) {
        let args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return afterEach.apply(ctx, args);
      };

      afterEach.skip = function (desc: string, opts: IAfterEachOpts, fn: AfterEachHookRegularMode) {
        let args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return afterEach.apply(ctx, args);
      };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      afterEach.skip.cb = afterEach.cb.skip = afterEach.skip;

    };

    TestSuite.prototype.__invokeChildren = function (val: any, start: Function) {

      const testIds = _.pluck(this.getChildren(), 'testId');

      const children = allDescribeBlocks.filter(function (test) {
        return _.contains(testIds, test.testId);
      });

      async.eachSeries(children, makeRunChild(val), start);
    };

    TestSuite.prototype.toString = function () {
      return this.constructor + ':' + this.desc;
    };

    TestSuite.prototype.log = function () {
      console.log(' [TESTSUITE LOGGER ] => ', ...Array.from(arguments));
    };

    TestSuite.prototype.series = function (cb: Function) {
      if (typeof cb === 'function') {
        cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
      }
      return this;
    };

    TestSuite.prototype.__startSuite = startSuite(suman, gracefulExit,
      handleBeforesAndAfters, notifyParentThatChildIsComplete);

    freezeExistingProps(TestSuite.prototype);
    return freezeExistingProps(new TestSuite(data));

  };

  return TestSuiteMaker;

}

module.exports = makeTestSuiteMaker;
