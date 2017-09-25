'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');
import util = require('util');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getCoreAndDeps} from './$core-n-$deps';

/////////////////////////////////////////////////////////////////

module.exports = function ($iocData: Object) {

  return function (names: Array<string>) {

    return names.map(function (n) {

      if (n === '$core') {
        return getCoreAndDeps().$core;
      }

      if (n === '$deps') {
        return getCoreAndDeps().$deps;
      }

      if (n === '$iocData') {
        return $iocData || {'suman': 'bogus data - please report this error.'}
      }

      try {
        return require(n);
      }
      catch (err) {
        _suman.logError(' => Cannot require dependency with name => ' + n,
          '...suman will continue optimistically.');
        console.error('\n');
        return null;
      }

    });

  }

};
