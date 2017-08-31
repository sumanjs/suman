'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var suman_constants_1 = require("../../config/suman-constants");
exports.cloneError = function (err, newMessage, stripAllButTestFilePathMatch) {
    var obj = {};
    obj.message = newMessage || "Suman implementation error: \"newMessage\" is not defined. Please report: " + suman_constants_1.constants.SUMAN_ISSUE_TRACKER_URL + ".";
    var temp;
    if (stripAllButTestFilePathMatch !== false) {
        temp = su.createCleanStack(String(err.stack || err));
    }
    else {
        temp = String(err.stack || err).split('\n');
    }
    temp[0] = newMessage;
    obj.message = newMessage;
    obj.stack = temp.join('\n');
    return obj;
};
