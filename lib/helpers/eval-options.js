'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
exports.evalOptions = function (arrayDeps, opts) {
    var preVal = arrayDeps.filter(function (a) {
        if (typeof a === 'string') {
            if (/.*:.*/.test(a)) {
                return a;
            }
            if (/:/.test(a)) {
                _suman.logWarning('Looks like you have a bad value in your options as strings =>', util.inspect(arrayDeps));
            }
        }
        else if (su.isObject(a)) {
            Object.assign(opts, a);
        }
        else {
            _suman.logWarning('You included an unexpected value in the array =>', util.inspect(arrayDeps));
        }
    });
    var toEval = "(function(){return {" + preVal.join(',') + "}})()";
    try {
        var obj = eval(toEval);
        Object.assign(opts, obj);
    }
    catch (err) {
        console.error('\n');
        _suman.logError('Could not evaluate the options passed via strings => ', util.inspect(preVal));
        _suman.logError('Suman will continue optimistically.');
        _suman.logError(err.stack || err);
        console.error('\n');
    }
};
