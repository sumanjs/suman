'use strict';

//project
const _suman = global.__suman = (global.__suman || {});


///////////////////////////////////////////////////////////////////////

module.exports = function handleUnexpectedErrorArg (err, isThrow) {
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
