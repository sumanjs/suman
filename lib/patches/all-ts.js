'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var assert = require('assert');
var _suman = global.__suman = (global.__suman || {});
var PConstructor = global.Promise;
var Promise = global.Promise = (function (_super) {
    __extends(PatchedPromise, _super);
    function PatchedPromise(executor) {
        var _this = this;
        if (process.domain) {
            executor = executor && process.domain.bind(executor);
        }
        _this = _super.call(this, executor) || this;
        return _this;
    }
    return PatchedPromise;
}(PConstructor));
var then = Promise.prototype.then;
Promise.prototype.then = function (fn1, fn2) {
    if (process.domain) {
        fn1 = fn1 && process.domain.bind(fn1);
        fn2 = fn2 && process.domain.bind(fn2);
    }
    return then.call(this, fn1, fn2);
};
var katch = Promise.prototype.catch;
Promise.prototype.catch = function (fn1) {
    if (process.domain) {
        fn1 = fn1 && process.domain.bind(fn1);
    }
    return katch.call(this, fn1);
};
String.prototype.times = Number.prototype.times = function (callback) {
    if (typeof callback !== 'function') {
        throw new TypeError('Callback is not a function');
    }
    else if (isNaN(parseInt(Number(this.valueOf())))) {
        throw new TypeError('Object/value is not a valid number');
    }
    for (var i = 0; i < Number(this.valueOf()); i++) {
        callback(i);
    }
};
var exit = process.exit;
process.exit = function (code, fn) {
    if (fn) {
        if (typeof fn !== 'function') {
            throw new Error(' => Suman internal implementation error => Please report ASAP, thanks.');
        }
        setTimeout(function () {
            console.error(' => Function timeout.');
            exit.call(process, (code || 1));
        }, 15000);
        fn(function (err, c) {
            if (err) {
                exit.call(process, (c || code || 1));
            }
            else {
                exit.call(process, (c || code || 0));
            }
        });
    }
    else {
        exit.call(process, code);
    }
};
Function.prototype.adhere = function () {
    var self = this;
    var args1 = Array.from(arguments);
    return function () {
        var args2 = Array.from(arguments);
        return self.apply(this, args1.concat(args2));
    };
};
Array.prototype.mapToObject = function (fn) {
    var obj = {};
    for (var i = 0; i < this.length; i++) {
        var ret = void 0;
        if (fn) {
            ret = fn.call(this, this[i], i);
        }
        else {
            ret = this[i];
        }
        var keys = Object.keys(ret);
        assert(keys.length, ' => Object needs keys.');
        for (var j = 0; j < keys.length; j++) {
            var k_1 = keys[j];
            obj[k_1] = ret[k_1];
        }
    }
    return obj;
};
module.exports = {};
