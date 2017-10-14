'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ITestSuite} from "suman-types/dts/test-suite";
import {IInjectionDeps} from "suman-types/dts/injection";
import {ISuman, Suman} from "../suman";

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
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getCoreAndDeps} from './$core-n-$deps';
import {getProjectModule, lastDitchRequire} from './helpers';


/*///////////// => what it do ///////////////////////////////////////////////////////////////

 this module is responsible for +++synchronously+++ injecting values;
 => values may be procured +asynchronously+ prior to this, but here we
 finish creating the entire arguments array, all synchronously

 //////////////////////////////////////////////////////////////////////////////////////////*/

export const makeBlockInjector = function (suman: ISuman, container: Object) {

  return function (suite: ITestSuite, parent: ITestSuite, depsObj: IInjectionDeps): Array<any> {

    const {sumanOpts} = _suman;

    return Object.keys(depsObj).map(key => {

      // console.log('depsObj => ',util.inspect(depsObj));

      // if (key in depsObj) {
      //   if (depsObj[key] !== '[suman reserved - no ioc match]') {
      //     return depsObj[key];
      //   }
      // }

      const lowerCaseKey = String(key).toLowerCase();


      if (depsObj[key] && depsObj[key] !== '[suman reserved - no ioc match]') {
        return depsObj[key];
      }

      switch (lowerCaseKey) {

        case '$args':
          return String(sumanOpts.user_args || '').split(/ +/).filter(i => i);
        case '$argsraw':
          return sumanOpts.user_args || '';
        case '$ioc':
          return _suman.$staticIoc;
        case 'b':
          return suite;
        case '$pre':
          return _suman['$pre'];
        case '$deps':
          return getCoreAndDeps().$deps;
        case '$core':
          return getCoreAndDeps().$core;
        case '$root':
        case '$projectroot':
          return _suman.projectRoot;
        case '$index':
        case '$project':
        case '$proj':
          return getProjectModule();

        case 'resume':
        case 'getResumeValue':
        case 'getResumeVal':
        case 'writable':
        case 'inject':
          return suite[key];

        case 'describe':
        case 'context':
        case 'suite':
        case 'afterallparenthooks':
        case 'before':
        case 'after':
        case 'beforeall':
        case 'afterall':
        case 'beforeeach':
        case 'aftereach':
        case 'it':
        case 'test':
        case 'setup':
        case 'teardown':
        case 'setuptest':
        case 'teardowntest':
          return container[lowerCaseKey];

        case 'userdata':
          return _suman.userData;
      }

      if (parent) {
        let val;
        if (val = parent.getInjectedValue(key)) {
          // note! if the injected value is falsy, it will get passed over
          return val;
        }
      }

      return lastDitchRequire(key, '<block-injector>');

    });

  };

};

