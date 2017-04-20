'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman = global.__suman = (global.__suman || {});


///////////////////////////////////////////////////////////////////////

export = function handleUnexpectedErrorArg (err: IPseudoError, isThrow: boolean) {
  if (err) {
    const $err = new Error(' => Suman implementation error => Please report!'
      + '\n' + (err.stack || err));
    console.error($err.stack);
    _suman._writeTestError($err.stack);
    if (isThrow) {
      throw $err;
    }
  }
};
