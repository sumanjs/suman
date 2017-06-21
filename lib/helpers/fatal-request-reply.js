'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var debug = require('suman-debug')('s:cli');
var _suman = global.__suman = (global.__suman || {});
var callable = true;
exports.fatalRequestReply = function (obj, cb) {
    _suman.sumanUncaughtExceptionTriggered = true;
    if (callable) {
        callable = false;
    }
    else {
        return process.nextTick(cb);
    }
    if (!_suman.usingRunner) {
        debug(' => Suman warning => Not using runner in this process, so we will never get reply, firing callback now.');
        return process.nextTick(cb);
    }
    process.on('message', function onFatalMessageReceived(msg) {
        var to = setTimeout(function () {
            process.removeListener('message', onFatalMessageReceived);
            return process.nextTick(cb);
        }, 3500);
        if (msg.info = 'fatal-message-received') {
            clearTimeout(to);
            process.removeListener('message', onFatalMessageReceived);
            process.nextTick(cb);
        }
    });
    process.send(obj);
};
