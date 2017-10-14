'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var debug = require('suman-debug')('s:cli');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var suman_constants_1 = require("../../config/suman-constants");
var socketio_child_client_1 = require("../index-helpers/socketio-child-client");
var callable = true;
exports.fatalRequestReply = function (obj, $cb) {
    var cb = su.once(null, $cb);
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
        return process.nextTick(cb);
    }
    var client = socketio_child_client_1.getClient();
    var FATAL = suman_constants_1.constants.runner_message_type.FATAL;
    var FATAL_MESSAGE_RECEIVED = suman_constants_1.constants.runner_message_type.FATAL_MESSAGE_RECEIVED;
    var to = setTimeout(cb, 2500);
    client.once(FATAL_MESSAGE_RECEIVED, function () {
        clearTimeout(to);
        process.nextTick(cb);
    });
    console.log('client sent fatal message to runner; waiting for response from runner...');
    obj.childId = process.env.SUMAN_CHILD_ID;
    client.emit(FATAL, obj);
};
