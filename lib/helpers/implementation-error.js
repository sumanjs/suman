'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
module.exports = function handleUnexpectedErrorArg(err, isThrow) {
    if (err) {
        var $err = new Error(' => Suman implementation error => Please report!'
            + '\n' + (err.stack || err));
        console.error($err.stack);
        _suman.writeTestError($err.stack);
        if (isThrow) {
            throw $err;
        }
    }
};
