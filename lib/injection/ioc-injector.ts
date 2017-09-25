'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getCoreAndDeps} from './$core-n-$deps';
import {getProjectModule, lastDitchRequire} from './helpers';

/////////////////////////////////////////////////////////////////

export const makeIocInjector = function ($iocData: Object, $preData: Object, $ioc: Object) {

  return function (names: Array<string>) {

    return names.map(function (n) {

      if (n === '$core') {
        return getCoreAndDeps().$core;
      }

      if (n === '$deps') {
        return getCoreAndDeps().$deps;
      }

      if (n === '$args') {
        return String(_suman.sumanOpts.user_args || '').split(/ +/).filter(i => i);
      }

      if (n === '$argsRaw') {
        return _suman.sumanOpts.user_args || '';
      }

      if (n === '$data') {
        return $iocData;
      }

      if (n === '$root' || n === '$projectRoot') {
        return _suman.projectRoot;
      }

      if (n === '$index' || n === '$project') {
        return getProjectModule();
      }

      if (n === '$pre') {
        return $preData || _suman['$pre'] || null;
      }

      if (n === '$ioc') {
        return $ioc || _suman.$staticIoc;
      }

      return lastDitchRequire(n, '<suman.ioc.js>');

    });

  }

};
