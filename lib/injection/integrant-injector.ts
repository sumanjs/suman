'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getCoreAndDeps} from './$core-n-$deps';
import {getProjectModule} from './helpers';

/////////////////////////////////////////////////////////////////

export default function (names: Array<string>) {

  return names.map(function (n) {

    if (n === '$core') {
      return getCoreAndDeps().$core;
    }

    if (n === '$deps') {
      return getCoreAndDeps().$deps;
    }

    if (n === '$root' || n === '$projectRoot') {
      return _suman.projectRoot;
    }

    if(n === '$index' || n === '$project'){
      return getProjectModule();
    }

    try {
      return require(n);
    }
    catch (err) {
      _suman.logError('integrant/pre injector warning => cannot require dependency with name => "' + n + '";' +
        ' Suman will continue optimistically.');
      console.error('\n');
      return null;
    }

  });

};
