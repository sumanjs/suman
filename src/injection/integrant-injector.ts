'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getProjectModule, lastDitchRequire, getCoreAndDeps} from './helpers';

/////////////////////////////////////////////////////////////////

export default function (names: Array<string>, $ioc: Object) {

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

    if (n === '$root' || n === '$projectRoot') {
      return _suman.projectRoot;
    }

    if (n === '$index' || n === '$project') {
      return getProjectModule();
    }

    if (n === '$ioc') {
      return _suman.$staticIoc || $ioc;
    }

    return lastDitchRequire(n, '<suman.once.pre.js>');

  });

};
