'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');
import util = require('util');
import assert = require('assert');

//npm
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getCoreAndDeps, getProjectModule, lastDitchRequire} from './helpers';

/////////////////////////////////////////////////////////////////

export const makePostInjector = function ($data: Object, $preData: Object, $ioc: Object) {

  return function (names: Array<string>) {

    return names.map(function (n) {

      if (n === '$core') {
        return getCoreAndDeps().$core;
      }

      if (n === '$deps') {
        return getCoreAndDeps().$deps;
      }

      if (n === '$args') {
        return _suman.sumanOpts.user_arg || [];
      }

      if (n === '$data') {
        return $data;
      }

      if (n === '$root' || n === '$projectRoot') {
        return _suman.projectRoot;
      }

      if (n === '$index' || n === '$project') {
        return getProjectModule();
      }

      if (n === '$pre') {
        return $preData || _suman['$pre'] || _suman.integrantHashKeyVals;
      }

      if (n === '$ioc') {
        return $ioc || _suman.$staticIoc;
      }

      return lastDitchRequire(n, '<suman.once.post.js>');

    });

  }

};
