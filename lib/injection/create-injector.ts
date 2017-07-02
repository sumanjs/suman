'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as assert from 'assert';
import * as EE from 'events';
import * as cp from 'child_process';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {$core, $deps, mappedPkgJSONDeps} = require('../injection/$core-n-$deps');

/////////////////////////////////////////////////////////////////

module.exports = function ($iocData: Object) {

  return function (names: Array<string>) {

    return names.map(function (n) {

      if (n === '$core') {
        return $core;
      }

      if (n === '$deps') {
        return $deps;
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
