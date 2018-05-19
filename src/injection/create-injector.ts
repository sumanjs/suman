'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ISuman, Suman} from "../suman";
import {IInjectionDeps} from "suman-types/dts/injection";
import {ITestSuite} from "suman-types/dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');
import util = require('util');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getProjectModule, lastDitchRequire, getCoreAndDeps} from './helpers';

/////////////////////////////////////////////////////////////////////////////////////////

export const makeCreateInjector = function (suman: ISuman, container: Object) {

  return function createInjector(suite: ITestSuite, names: Array<string>): Array<any> {

    const sumanOpts = suman.opts;

    return names.map(key => {

      const lowerCaseKey = String(key).toLowerCase();

      switch (lowerCaseKey) {

        case '$args':
          return sumanOpts.user_arg || [];
        case '$iocStatic':
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
        case 'beforeall':
        case 'afterall':
        case 'beforeeachblock':
        case 'aftereachblock':
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

  }

};
