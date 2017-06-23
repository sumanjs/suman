"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var pragmatik = require('pragmatik');
var async = require('async');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
function default_1(args, fnIsRequired) {
    var desc = args[0], opts = args[1], arr = args[2], fn = args[3];
    if (arr && fn) {
        throw new Error(' => Please define either an array or callback.');
    }
    var arrayDeps;
    if (arr) {
        fn = arr[arr.length - 1];
        if (fnIsRequired) {
            assert.equal(typeof fn, 'function', ' => Suman usage error => ' +
                'You need to pass a function as the last argument to the array.');
            arrayDeps = arr.slice(0, -1);
        }
    }
    desc = desc || (fn ? fn.name : '(suman unknown name)');
    arrayDeps = arrayDeps || [];
    return {
        arrayDeps: arrayDeps,
        args: [desc, opts, fn]
    };
}
exports.default = default_1;
