'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as path from 'path';
import * as util from 'util';
import * as assert from 'assert';

//npm
const colors = require('colors/safe');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {$core, $deps, mappedPkgJSONDeps} = require('../injection/$core-n-$deps');

/////////////////////////////////////////////////////////////////

export const makePostInjector = function ($data: Object, $preData: Object) {

  return function (names: Array<string>) {

    return names.map(function (n) {

      if (n === '$core') {
        return $core;
      }

      if (n === '$deps') {
        return $deps;
      }

      if (n === '$data') {
        return $data;
      }

      if (n === '$root') {
        return _suman.projectRoot;
      }

      if (n === '$pre') {
        return $preData || _suman['$pre'] || _suman.integrantHashKeyVals;
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
