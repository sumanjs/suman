'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
exports.parseArgs = function (args, fnIsRequired) {
    var desc = args[0], opts = args[1], arr = args[2], fn = args[3];
    if (arr && fn) {
        throw new Error(' => Suman usage error. Please define either an array or callback.');
    }
    var arrayDeps;
    if (arr) {
        if (typeof arr[arr.length - 1] === 'function') {
            fn = arr[arr.length - 1];
            arrayDeps = arr.slice(0, -1);
        }
        else {
            arrayDeps = arr.slice(0);
        }
    }
    if (fnIsRequired) {
        assert.equal(typeof fn, 'function', ' => Suman usage error => ' +
            'You need to pass a function as the last argument to the array.');
    }
    desc = desc || (fn ? fn.name : '(suman unknown name)');
    arrayDeps = arrayDeps || [];
    return {
        arrayDeps: arrayDeps,
        args: [desc, opts, fn]
    };
};
