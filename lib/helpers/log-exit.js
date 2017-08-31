'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var callable = true;
exports.run = function (code) {
    if (callable) {
        callable = false;
        console.log('\n');
        console.log(' => Suman cli exiting with code: ', code);
        console.log('\n');
    }
};
