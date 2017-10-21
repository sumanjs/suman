'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var EE = require("events");
var os = require("os");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var suman_events_1 = require("suman-events");
var suman_constants_1 = require("../../config/suman-constants");
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var results = _suman.tableResults = (_suman.tableResults || []);
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var socketio_child_client_1 = require("../index-helpers/socketio-child-client");
var fatalRequestReplyCallable = true;
exports.fatalRequestReply = function (obj, $cb) {
    var cb = su.once(null, $cb);
    _suman.sumanUncaughtExceptionTriggered = obj;
    if (fatalRequestReplyCallable) {
        fatalRequestReplyCallable = false;
    }
    else {
        return process.nextTick(cb);
    }
    if (_suman.$forceInheritStdio) {
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
exports.findSumanServer = function (serverName) {
    var sumanConfig = _suman.sumanConfig;
    var server = null;
    var hostname = os.hostname();
    if (sumanConfig.servers && serverName) {
        if (sumanConfig.servers[serverName]) {
            server = sumanConfig.servers[serverName];
        }
        else {
            throw new Error('Suman usage error => Bad server name ("' + serverName + '"), it does not match any ' +
                'properties on the servers properties in your suman.conf.js file.');
        }
    }
    else if (sumanConfig.servers && sumanConfig.servers[hostname]) {
        server = sumanConfig.servers[hostname];
        rb.emit(String(suman_events_1.events.USING_SERVER_MARKED_BY_HOSTNAME), hostname, server);
    }
    else if (sumanConfig.servers && sumanConfig.servers['*default']) {
        server = sumanConfig.servers['*default'];
        rb.emit(String(suman_events_1.events.USING_DEFAULT_SERVER), '*default', server);
    }
    else {
        server = Object.freeze({ host: '127.0.0.1', port: 6969 });
        rb.emit(String(suman_events_1.events.USING_FALLBACK_SERVER), server);
    }
    if (!server.host)
        throw new Error('no suman-server host specified.');
    if (!server.port)
        throw new Error('no suman-server port specified.');
    return server;
};
exports.makeOnSumanCompleted = function (suman) {
    return function onSumanCompleted(code, msg) {
        suman.sumanCompleted = true;
        process.nextTick(function () {
            suman.logFinished(code || 0, msg, function (err, val) {
                if (_suman.sumanOpts.check_memory_usage) {
                    _suman.logError('Maximum memory usage during run => ' + util.inspect({
                        heapTotal: _suman.maxMem.heapTotal / 1000000,
                        heapUsed: _suman.maxMem.heapUsed / 1000000
                    }));
                }
                results.push(val);
                suiteResultEmitter.emit('suman-completed');
            });
        });
    };
};
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
exports.parseArgs = function (args, fnIsRequired) {
    var desc = args[0], opts = args[1], arr = args[2], fn = args[3];
    if (arr && fn) {
        throw new Error('Suman usage error. Please define either an array or callback.');
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
