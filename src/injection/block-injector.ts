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
import chalk from 'chalk';
import su = require('suman-utils');
const includes = require('lodash.includes');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getProjectModule, lastDitchRequire, getCoreAndDeps} from './helpers';

/*///////////// => what it do ///////////////////////////////////////////////////////////////////

 this module is responsible for +++synchronously+++ injecting values;
 => values may be procured +asynchronously+ prior to this, but here we
 finish creating the entire arguments array, all synchronously

 //////////////////////////////////////////////////////////////////////////////////////////////*/

export const makeBlockInjector = (suman: ISuman, container: Object) => {

  return function blockInjector(suite: ITestSuite, parent: ITestSuite, names: Array<string>): Array<any> {

    const sumanOpts = suman.opts;

    return names.map(key => {

      const lowerCaseKey = String(key).toLowerCase().trim();
      switch (lowerCaseKey) {

        case '$args':
          return sumanOpts.user_arg || [];
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
        case 'getresumevalue':
        case 'getresumeval':
        case 'writable':
          return suite[key];

        case 'describe':
        case 'context':
        case 'suite':
        case 'afterallparenthooks':
        case 'before':
        case 'after':
        case 'inject':
        case 'beforeeachblock':
        case 'aftereachblock':
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

      return lastDitchRequire(key, '<block-injector>');

    });

  };

};

