'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as path from 'path';

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
const {$core, $deps, mappedPkgJSONDeps} = require('../injection/$core-n-$deps');

/////////////////////////////////////////////////////////////////

export default function (names: Array<string>) {

  return names.map(function (n) {

    if (n === '$core') {
      return $core;
    }

    if (n === '$deps') {
      return $deps;
    }

    if (n === '$root') {
      return _suman.projectRoot;
    }

    try {
      return require(n);
    }
    catch (err) {
      _suman.logError('warning => suman cannot require dependency with name => "' + n + '";' +
        ' Suman will continue optimistically.');
      console.error('\n');
      return null;
    }

  });

};
