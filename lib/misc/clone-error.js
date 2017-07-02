'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
exports.cloneError = function (err, newMessage, stripAllButTestFilePathMatch) {
    var obj = {};
    obj.message = newMessage || ' => Suman implementation error => newMessage is not defined. Please report on Github issue tracker.';
    var temp = err.stack.split('\n');
    if (stripAllButTestFilePathMatch !== false) {
        temp = temp.filter(function (line, index) {
            return !String(line).match(/\/node_modules\//);
        });
    }
    temp[0] = newMessage;
    temp = temp.map(function (item) {
        return item;
    });
    obj.message = newMessage;
    obj.stack = temp.join('\n');
    return obj;
};
