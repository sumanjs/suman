'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var debug = require('suman-debug')('s:cli');
var _suman = global.__suman = (global.__suman || {});
var callable = true;
exports.fatalRequestReply = function (obj, cb) {
    console.error('obj in fatal request reply => ', obj);
    _suman.sumanUncaughtExceptionTriggered = obj;
    if (callable) {
        callable = false;
    }
    else {
        console.log('callabled is false...');
        return process.nextTick(cb);
    }
    if (_suman.$forceInheritStdio) {
        console.log('$forceInheritStdio');
        return process.nextTick(cb);
    }
    if (!_suman.usingRunner) {
        _suman.logError('warning => Not using runner in this process, so we will never get reply, firing callback now.');
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
    console.log('waiting for response from runner...');
    process.send(obj);
};
