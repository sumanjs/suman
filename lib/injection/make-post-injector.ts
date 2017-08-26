'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');
import util = require('util');
import assert = require('assert');

//npm
import * as chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getCoreAndDeps} from './$core-n-$deps';
import {getProjectModule} from './helpers';

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

      if(n === '$args'){
        return String(_suman.sumanOpts.user_args || '').split(/ +/).filter(i => i);
      }

      if(n === '$argsRaw'){
        return _suman.sumanOpts.user_args || '';
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

      try {
        return require(n);
      }
      catch (err) {
        _suman.logError('warning => [suman.once.post injector] => Suman will continue optimistically, ' +
          'but cannot require dependency with name => "' + n + '"');
        return null;
      }

    });

  }

};
