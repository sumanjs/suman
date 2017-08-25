'use strict';
import {ITestSuite} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";
import {IInjectionDeps} from "../../dts/injection";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
const pragmatik = require('pragmatik');
import * as chalk from 'chalk';
import su = require('suman-utils');

const includes = require('lodash.includes');

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');
import container from './injection-container';
import {getCoreAndDeps} from './$core-n-$deps';

const rules = require('../helpers/handle-varargs');
import {getProjectModule} from './helpers';

/*///////////// => what it do ///////////////////////////////////////////////////////////////

 this module is responsible for +++synchronously+++ injecting values;
 => values may be procured +asynchronously+ prior to this, but here we
 finish creating the entire arguments array, all synchronously


 //////////////////////////////////////////////////////////////////////////////////////////*/

export const makeBlockInjector = function (suman: ISuman) {

  // => suman is unused, but just in case we need it, we will keep this functor pattern
  return function (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps): Array<any> {

    return Object.keys(depsObj).map(key => {

      const dep = depsObj[key];

      if (dep) {
        return dep;
      }

      switch (key) {

        case '$ioc':
          return _suman.$staticIoc;
        case '$block':
          return suite;
        case '$pre':
          return _suman['$pre'];
        case '$deps':
          return getCoreAndDeps().$deps;
        case '$core':
          return getCoreAndDeps().$core;
        case '$root':
        case '$projectRoot':
          return _suman.projectRoot;

        case '$index':
        case '$project':
          return getProjectModule();

        case 'resume':
        case 'extraArgs':
        case 'getResumeValue':
        case 'getResumeVal':
        case 'writable':
        case 'inject':
          return suite[key];

        case 'describe':
        case 'context':
        case 'afterAllParentHooks':
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

      }

      if (parentSuite) {
        let val;
        if (val = parentSuite.getInjectedValue(key)) {
          // note! if the injected value is falsy, it will get passed over
          return val;
        }
      }

      try {
        return require(key);
      }
      catch (err) {
        _suman.logError(`Could not require() dependency with value => "${key}", Suman will continue optimistically.`);
        return undefined;
      }

    });

  };

};

