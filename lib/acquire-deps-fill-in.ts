'use strict';
import {ITestSuite} from "../dts/test-suite";
import {IInjectHookCallbackMode, IInjectHookRegularMode, IInjectOpts} from "../dts/inject";
import {BeforeHookCallbackMode, BeforeHookRegularMode, IBeforeOpts} from "../dts/before";
import {ISuman} from "../dts/suman";
import {IDescribeOpts, TDescribeHook} from "../dts/describe";
import {IItOpts, ItHookCallbackMode, ItHookRegularMode} from "../dts/it";
import {AfterHookCallbackMode, AfterHookRegularMode, IAfterOpts} from "../dts/after";
import {BeforeEachHookCallbackMode, BeforeEachHookRegularMode, IBeforeEachOpts} from "../dts/before-each";
import {IAfterEachOpts, TAfterEachHookCallbackMode, TAfterEachHookRegularMode} from "../dts/after-each";
import {IInjectionDeps} from "../dts/injection";

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
import container from './injection/injection-container';
const {$core, $deps, mappedPkgJSONDeps} = require('./injection/$core-n-$deps');
const rules = require('./helpers/handle-varargs');


/*///////////////////////////////////////////////////////////////////

 this module is responsible for +++synchronously+++ injecting values;
 => values may be procured +asynchronously+ prior to this, but here we
 finish creating the entire arguments array, all synchronously

 //////////////////////////////////////////////////////////////////*/


//////////////////////////////////////////////////////////////////////////////////////////////

export = function (suman: ISuman) {

  // => suman is unused
  return function (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps): Array<any> {

    return Object.keys(depsObj).map(key => {

      const dep = depsObj[key];

      if (dep) {
        return dep;
      }

      if (includes(constants.SUMAN_HARD_LIST, key)) {

        switch (key) {

          case 'suite':
            return suite;

          case '$pre':
            return _suman['$pre'];

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

      // if (suite.isRootSuite && mappedPkgJSONDeps.indexOf(key) > -1) {
      //   return $deps[key];
      // }

      // if (parentSuite && (key in parentSuite.injectedValues)) {
      //   return parentSuite.injectedValues[key];
      // }

      if (parentSuite) {
        let val;
        if (val = parentSuite.getInjectedValue(key)) {
          // note that if the injected value is falsy, it will get passed over
          return val;
        }
      }

      try {
        return require(key);
      }
      catch (err) {
        _suman.logError(`Could not require() dependency with value => "${key}", will continue optimistically.`);
        return undefined;
      }


    });

  };

};

