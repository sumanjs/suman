'use strict';
import {IPseudoError, IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});


///////////////////////////////////////////////////////////////////////

export = function handleUnexpectedErrorArg (err: IPseudoError, isThrow: boolean) {
  if (err) {
    const $err = new Error(' => Suman implementation error => Please report!'
      + '\n' + (err.stack || err));
    console.error($err.stack);
    _suman.writeTestError($err.stack);
    if (isThrow) {
      throw $err;
    }
  }
};
