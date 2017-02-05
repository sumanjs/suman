'use strict';  // important note: so errors get thrown if properties are modified after the fact

//TODO: create immutable props -
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

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
const rules = require('./helpers/handle-varargs');
const implementationError = require('./helpers/implementation-error');
const constants = require('../config/suman-constants');
const sumanUtils = require('suman-utils/utils');
const freezeExistingProps = require('./freeze-existing');
const originalAcquireDeps = require('./acquire-deps-original');
const startSuite = require('./test-suite-helpers/start-suite');
const makeTestSuiteBase = require('./make-test-suite-base');

// (TestSuite methods)
const makeIt = require('./test-suite-methods/make-it');
const makeAfter = require('./test-suite-methods/make-after');
const makeAfterEach = require('./test-suite-methods/make-after-each');
const makeBeforeEach = require('./test-suite-methods/make-before-each');
const makeBefore = require('./test-suite-methods/make-before');
const makeInject = require('./test-suite-methods/make-inject');
const makeDescribe = require('./test-suite-methods/make-describe');

///////////////////////////////////////////////////////////////////////

function makeRunChild(val) {
  return function runChild(child, cb) {
    child._run(val, cb);
  }
}

function makeTestSuiteMaker(suman, gracefulExit) {

  const allDescribeBlocks = suman.allDescribeBlocks;
  const _interface = String(suman.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const TestSuiteBase = makeTestSuiteBase(suman);

  //TODO: need to validate raw data...
  const TestSuiteMaker = function (data) {

    var it, describe, before, after, beforeEach, afterEach, inject;

    function TestSuite(obj) {

      this.interface = suman.interface;
      this.desc = this.title = obj.desc; //TODO: can grab name from function

      this.timeout = function () {
        console.error('not implemented yet.');
      };

      this.slow = function () {
        console.error('not implemented yet.');
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

      describe = this.context = makeDescribe(suman, gracefulExit, TestSuiteMaker, zuite);
      _interface === 'TDD' ? this.suite = describe : this.describe = describe;
    }

    //Note: we hide most properties in the prototype
    TestSuite.prototype = Object.create(new TestSuiteBase(data));

    TestSuite.prototype.__bindExtras = function bindExtras() {

      const ctx = this;

      describe.delay = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.blockSignature);
        _args[1].delay = true;
        _args[1].__preParsed = true;
        describe.apply(ctx, _args);
      };

      describe.skip = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.blockSignature);
        _args[1].skip = true;
        _args[1].__preParsed = true;
        describe.apply(ctx, _args);
      };

      describe.only = function (desc, opts, fn) {
        suman.describeOnlyIsTriggered = true;
        const _args = pragmatik.parse(arguments, rules.blockSignature);
        _args[1].only = true;
        _args[1].__preParsed = true;
        describe.apply(ctx, _args);
      };

      it.skip = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.testCaseSignature);
        _args[1].skip = true;
        _args[1].__preParsed = true;
        return it.apply(ctx, _args);
      };

      it.only = function (desc, opts, fn) {
        suman.itOnlyIsTriggered = true;
        const _args = pragmatik.parse(arguments, rules.testCaseSignature);
        _args[1].only = true;
        _args[1].__preParsed = true;
        return it.apply(ctx, _args);
      };

      it.only.cb = function (desc, opts, fn) {
        suman.itOnlyIsTriggered = true;
        const _args = pragmatik.parse(arguments, rules.testCaseSignature);
        _args[1].only = true;
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return it.apply(ctx, _args);
      };

      it.skip.cb = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.testCaseSignature);
        _args[1].skip = true;
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return it.apply(ctx, _args);
      };

      it.cb = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.testCaseSignature);
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return it.apply(ctx, _args);
      };

      it.cb.skip = it.skip.cb;
      it.cb.only = it.only.cb;

      inject.cb = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return inject.apply(ctx, _args);
      };

      inject.skip = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].skip = true;
        _args[1].__preParsed = true;
        return inject.apply(ctx, _args);
      };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      inject.skip.cb = inject.cb.skip = inject.skip;

      before.cb = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return before.apply(ctx, _args);
      };

      before.skip = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].skip = true;
        _args[1].__preParsed = true;
        return before.apply(ctx, _args);
      };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      before.skip.cb = before.cb.skip = before.skip;

      after.cb = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return after.apply(ctx, _args);
      };

      after.skip = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].skip = true;
        _args[1].__preParsed = true;
        return after.apply(ctx, _args);
      };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      after.skip.cb = after.cb.skip = after.skip;

      beforeEach.cb = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return beforeEach.apply(ctx, _args);
      };

      beforeEach.skip = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].skip = true;
        _args[1].__preParsed = true;
        return beforeEach.apply(ctx, _args);
      };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      beforeEach.skip.cb = beforeEach.cb.skip = beforeEach.skip;

      afterEach.cb = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].cb = true;
        _args[1].__preParsed = true;
        return afterEach.apply(ctx, _args);
      };

      afterEach.skip = function (desc, opts, fn) {
        const _args = pragmatik.parse(arguments, rules.hookSignature);
        _args[1].skip = true;
        _args[1].__preParsed = true;
        return afterEach.apply(ctx, _args);
      };

      // to save memory we can make this equivalence since if the hook is skipped
      // it won't matter if it's callback mode or not :)
      afterEach.skip.cb = afterEach.cb.skip = afterEach.skip;

    };

    TestSuite.prototype.__invokeChildren = function (val, start) {

      const testIds = _.pluck(this.getChildren(), 'testId');

      const children = allDescribeBlocks.filter(function (test) {
        return _.contains(testIds, test.testId);
      });

      async.eachSeries(children, makeRunChild(val), start);
    };

    TestSuite.prototype.toString = function () {
      return this.constructor + ':' + this.desc;
    };

    // TestSuite.prototype.log = function (data) {
    //     suman.log(data, this);
    // };

    TestSuite.prototype.series = function (cb) {
      if (typeof cb === 'function') {
        cb.apply(this, [(_interface === 'TDD' ? this.test : this.it).bind(this)]);
      }
      return this;
    };

    TestSuite.prototype.__startSuite = startSuite(suman, gracefulExit);

    freezeExistingProps(TestSuite.prototype);
    return freezeExistingProps(new TestSuite(data));

  };

  return TestSuiteMaker;

}

module.exports = makeTestSuiteMaker;
