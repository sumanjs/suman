'use strict';
import {ITestSuite} from "../dts/test-suite";
import {IInjectHookCallbackMode, IInjectHookRegularMode, IInjectOpts} from "../dts/inject";
import {BeforeHookCallbackMode, BeforeHookRegularMode, IBeforeOpts} from "../dts/before";
import {ISuman} from "../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');

//npm
const pragmatik = require('pragmatik');
const colors = require('colors/safe');
const path = require('path');
const su = require('suman-utils');
const includes = require('lodash.includes');

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');
const {$core, $deps, mappedPkgJSONDeps} = require('./injection/$core-n-$deps');
const rules = require('./helpers/handle-varargs');

/*///////////////////////////////////////////////////////////////////

 this module is responsible for +++synchronously+++ injecting values;
 => values may be procured +asynchronously+ prior to this, but here we
 finish creating the entire arguments array, all synchronously

 //////////////////////////////////////////////////////////////////*/


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

  describe: function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
    return _suman.ctx.describe.apply(_suman.ctx, arguments);
  },

  it: function () {
    return _suman.ctx.it.apply(_suman.ctx, arguments);
  },

  inject: function () {
    return _suman.ctx.inject.apply(_suman.ctx, arguments);
  },

};


container.describe.delay =
  function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
    let args = pragmatik.parse(arguments, rules.blockSignature);
    args[1].delay = true;
    args[1].__preParsed = true;
    container.describe.apply(this, args);
  };

container.describe.skip =
  function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
    let args = pragmatik.parse(arguments, rules.blockSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    container.describe.apply(this, args);
  };

container.describe.only =
  function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
    // suman.describeOnlyIsTriggered = true; // TODO
    let args = pragmatik.parse(arguments, rules.blockSignature);
    args[1].only = true;
    args[1].__preParsed = true;
    container.describe.apply(this, args);
  };


container.describe.skip.delay = container.describe.delay.skip = container.describe.skip;

container.describe.only.delay = container.describe.delay.only =
  function (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook) {
    // suman.describeOnlyIsTriggered = true; //TODO
    let args = pragmatik.parse(arguments, rules.blockSignature);
    args[1].only = true;
    args[1].__preParsed = true;
    container.describe.apply(this, args);
  };


container.it.skip =
  function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.testCaseSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.it.apply(this, args);
  };

container.it.only =
  function (desc: string, opts: IItOpts, fn: ItHookRegularMode) {
    // suman.itOnlyIsTriggered = true; // TODO
    let args = pragmatik.parse(arguments, rules.testCaseSignature);
    args[1].only = true;
    args[1].__preParsed = true;
    return container.it.apply(this, args);
  };

container.it.only.cb =
  function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
    // suman.itOnlyIsTriggered = true; //TODO
    let args = pragmatik.parse(arguments, rules.testCaseSignature);
    args[1].only = true;
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.it.apply(this, args);
  };

container.it.skip.cb =
  function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.testCaseSignature);
    args[1].skip = true;
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.it.apply(this, args);
  };

container.it.cb =
  function (desc: string, opts: IItOpts, fn: ItHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.testCaseSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.it.apply(this, args);
  };

container.it.cb.skip = container.it.skip.cb;
container.it.cb.only = container.it.only.cb;

container.inject.cb =
  function (desc: string, opts: IInjectOpts, fn: IInjectHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.inject.apply(this, args);
  };

container.inject.skip =
  function (desc: string, opts: IInjectOpts, fn: IInjectHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.inject.apply(this, args);
  };

// to save memory we can make this equivalence since if the hook is skipped
// it won't matter if it's callback mode or not :)
container.inject.skip.cb = container.inject.cb.skip = container.inject.skip;

container.before.cb =
  function (desc: string, opts: IBeforeOpts, fn: BeforeHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.before.apply(this, args);
  };

container.before.skip =
  function (desc: string, opts: IBeforeOpts, fn: BeforeHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.before.apply(this, args);
  };

// to save memory we can make this equivalence since if the hook is skipped
// it won't matter if it's callback mode or not :)
container.before.skip.cb = container.before.cb.skip = container.before.skip;

// first four
container.after.skip =
  function (desc: string, opts: IAfterOpts, fn: AfterHookRegularMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

container.after.last =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].last = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

container.after.cb =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

container.after.always =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].always = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

// after.cb 2

container.after.cb.always =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].always = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

container.after.cb.last =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].last = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

// after.last 2

container.after.last.cb =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].last = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };

container.after.last.always =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].last = true;
    args[1].always = true;
    args[1].__preParsed = true;
    return container.after.apply(this, args);
  };


// after.always 2

container.after.always.cb =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
    let args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].always = true;
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.after(...args);
  };

container.after.always.last =
  function (desc: string, opts: IAfterOpts, fn: AfterHookCallbackMode) {
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


//////////////////////////////////////////////////////////////////////////////////////////////

export = function (suman: ISuman) {

  // => suman is unused

  return function (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps): Array<any> {

    return Object.keys(depsObj).map(key => {

      const dep = depsObj[key];

      if (dep) {
        return dep;
      }
      else if (includes(constants.SUMAN_HARD_LIST, key)) {

        switch (key) {

          case 'suite':
            return suite;

          case '$deps':
            return $deps;

          case '$core':
            return $core;

          case '$root':
            return _suman.projectRoot;

          case 'resume':
          case 'extraArgs':
          case 'getResumeValue':
          case 'getResumeVal':
          case 'writable':
          case 'inject':
            return suite[key];

          // case 'describe':
          // case 'before':
          // case 'after':
          // case 'beforeEach':
          // case 'afterEach':
          // case 'it':
          //   assert(suite.interface === 'BDD', ' => Suman usage error, using the wrong interface.');
          //   return suite[key];

          case 'describe':
          case 'before':
          case 'after':
          case 'beforeEach':
          case 'afterEach':
          case 'it':
            assert(suite.interface === 'BDD', ' => Suman usage error, using the wrong interface.');
            return container[key];

          case 'test':
          case 'setup':
          case 'teardown':
          case 'setupTest':
          case 'teardownTest':
            assert(suite.interface === 'TDD', ' => Suman usage error, using the wrong interface.');
            return suite[key];

          case 'userData':
            return _suman.userData;

          default:
            let e = new Error(' => Suman not implemented - the following key is not injectable => "' + key + '"');
            if (_suman.inBrowser) {
              console.error(e);
            }
            throw e;
        }

      }
      else if (suite.isRootSuite && mappedPkgJSONDeps.indexOf(key) > -1) {
        return $deps[key];
      }
      else if (parentSuite && (key in parentSuite.injectedValues)) {
        return parentSuite.injectedValues[key];
      }
      else {
        try {
          return require(key);
        }
        catch (err) {
          console.error(` => Could not require() dependency with value => "${key}", will continue optimistically.`);
          return undefined;
        }
      }

    });

  };

};

