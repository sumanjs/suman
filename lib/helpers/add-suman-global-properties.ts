'use strict';

import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const colors = require('colors/safe');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

debugger;

if (!('SUMAN_INCEPTION_LEVEL' in process.env)) {
  _suman.inceptionLevel = 0;
  process.env.SUMAN_INCEPTION_LEVEL = 0;
}
else {
  let sil = Number(process.env.SUMAN_INCEPTION_LEVEL);
  let silVal = ++sil;
  _suman.inceptionLevel = silVal;
  process.env.SUMAN_INCEPTION_LEVEL = silVal;
}

if (_suman.inceptionLevel < 1) {
  _suman.log = console.log.bind(console, colors.gray.bold(' => [suman] => '));
  _suman.logWarning = console.error.bind(console, colors.yellow(' => [suman] => '));
  _suman.logError = console.error.bind(console, colors.red(' => [suman] => '));
}
else {
  _suman.log = console.log.bind(console);
  _suman.logWarning = console.error.bind(console);
  _suman.logError = console.error.bind(console);
}

