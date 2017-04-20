'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var callable = true;
module.exports = function (code) {
    if (callable) {
        callable = false;
        console.log('\n\n => Suman cli exiting with code: ', code, '\n\n');
    }
};
