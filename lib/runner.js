'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var slicedArgs = process.argv.slice(2);
var execArgs = process.execArgv.slice(0);
var weAreDebugging = require('./helpers/we-are-debugging');
if (false) {
    var stdout_1 = process.stdout.write;
    process.stdout.write = function (data) {
        stdout_1(new Error(String(data)).stack);
        stdout_1.apply(process.stdout, arguments);
    };
    var stderr_1 = process.stderr.write;
    process.stderr.write = function (data) {
        stderr_1(new Error(String(data)).stack);
        stderr_1.apply(process.stderr, arguments);
    };
}
var assert = require('assert');
var util = require('util');
var EE = require('events');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var os = require('os');
var domain = require('domain');
var fnArgs = require('function-arguments');
var async = require('async');
var mapValues = require('lodash.mapvalues');
var readline = require('readline');
var colors = require('colors/safe');
var a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;
var makeBeep = require('make-beep');
var events = require('suman-events');
var debug = require('suman-debug')('s:runner');
var _suman = global.__suman = (global.__suman || {});
var integrantInjector = require('./injection/integrant-injector');
var constants = require('../config/suman-constants').constants;
var ascii = require('./helpers/ascii');
var su = require('suman-utils');
var make_handle_blocking_1 = require("./runner-helpers/make-handle-blocking");
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var handleFatalMessage = require('./runner-helpers/handle-fatal-message');
var logTestResult = require('./runner-helpers/log-test-result');
var onExit = require('./runner-helpers/on-exit');
var makeMakeExit = require('./runner-helpers/make-exit');
var makeHandleIntegrantInfo = require('./runner-helpers/handle-integrant-info');
var makeBeforeExit = require('./runner-helpers/make-before-exit-once-post');
var makeSingleProcess = require('./runner-helpers/handle-single-process');
var handle_multiple_processes_1 = require("./runner-helpers/handle-multiple-processes");
var cwd = process.cwd();
var projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(cwd);
var messages = [];
var integrantHash = {};
var integrantHashKeyValsForSumanOncePost = {};
var config = _suman.sumanConfig;
var oncePosts = {};
var allOncePostKeys = [];
var tableRows = {};
var forkedCPs = [];
var runnerObj = {
    doneCount: 0,
    tableCount: 0,
    listening: true,
    processId: 1,
    startTime: null,
    endTime: null,
    bailed: false,
    queuedCPs: [],
    hasOncePostFile: false,
    innited: false,
    oncePostModule: null,
    oncePostModuleRet: null,
    depContainerObj: null,
    handleBlocking: null
};
var handleIntegrantInfo = makeHandleIntegrantInfo(runnerObj, allOncePostKeys, integrantHash, integrantHashKeyValsForSumanOncePost);
var makeExit = makeMakeExit(runnerObj, tableRows);
var beforeExitRunOncePost = makeBeforeExit(runnerObj, oncePosts, integrantHashKeyValsForSumanOncePost, allOncePostKeys);
process.once('exit', onExit);
process.on('error', function (err) {
    console.error(' => Whoops! Error in runner process :\n', err.stack || err);
});
process.once('uncaughtException', function (e) {
    console.error('\n\n => Suman runner uncaughtException...\n', e.stack || e);
    process.exit(1);
});
process.on('message', function (data) {
    console.error(' => Weird! => Suman runner received a message:', (typeof data === 'string' ? data : util.inspect(data)));
});
function handleTableData(n, data) {
    runnerObj.tableCount++;
    tableRows[n.shortTestPath].tableData = data;
    n.send({
        info: 'table-data-received'
    });
}
function logTestData(data) {
    throw new Error('this should not be used currently');
}
function handleMessageForSingleProcess(msg, n) {
    switch (msg.type) {
        case constants.runner_message_type.TABLE_DATA:
            break;
        case constants.runner_message_type.INTEGRANT_INFO:
            handleIntegrantInfo(msg, n);
            break;
        case constants.runner_message_type.LOG_DATA:
            logTestData(msg);
            break;
        case constants.runner_message_type.LOG_RESULT:
            logTestResult(msg, n);
            break;
        case constants.runner_message_type.FATAL_SOFT:
            console.error('\n\n' + colors.grey(' => Suman warning => ') + colors.magenta(msg.msg) + '\n');
            break;
        case constants.runner_message_type.FATAL:
            n.send({ info: 'fatal-message-received' });
            handleFatalMessage(msg.data, n);
            break;
        case constants.runner_message_type.WARNING:
            console.error('\n\n ' + colors.bgYellow('Suman warning: ' + msg.msg + '\n'));
            break;
        case constants.runner_message_type.NON_FATAL_ERR:
            console.error('\n\n ' + colors.red('non-fatal suite error: ' + msg.msg + '\n'));
            break;
        case constants.runner_message_type.CONSOLE_LOG:
            console.log(msg.msg);
            break;
        case constants.runner_message_type.MAX_MEMORY:
            console.log('\nmax memory: ' + util.inspect(msg.msg));
            break;
        default:
            throw new Error(' => Suman internal error => bad msg.type in runner');
    }
}
function handleMessage(msg, n) {
    switch (msg.type) {
        case constants.runner_message_type.TABLE_DATA:
            handleTableData(n, msg.data);
            break;
        case constants.runner_message_type.INTEGRANT_INFO:
            handleIntegrantInfo(msg, n);
            break;
        case constants.runner_message_type.LOG_DATA:
            logTestData(msg);
            break;
        case constants.runner_message_type.LOG_RESULT:
            logTestResult(msg, n);
            break;
        case constants.runner_message_type.FATAL_SOFT:
            console.error('\n\n' + colors.grey(' => Suman warning => ') + colors.magenta(msg.msg) + '\n');
            break;
        case constants.runner_message_type.FATAL:
            n.send({ info: 'fatal-message-received' });
            handleFatalMessage(msg.data, n);
            break;
        case constants.runner_message_type.WARNING:
            console.error('\n\n ' + colors.bgYellow('Suman warning: ' + msg.msg + '\n'));
            break;
        case constants.runner_message_type.NON_FATAL_ERR:
            console.error('\n\n ' + colors.red('non-fatal suite error: ' + msg.msg + '\n'));
            break;
        case constants.runner_message_type.CONSOLE_LOG:
            console.log(msg.msg);
            break;
        case constants.runner_message_type.MAX_MEMORY:
            console.log('\n => Max memory: ' + util.inspect(msg.msg));
            break;
        default:
            throw new Error(' => Suman implementation error => Bad msg.type in runner, perhaps the user sent a message with process.send?');
    }
}
var runSingleOrMultipleDirs = handle_multiple_processes_1.default(runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit);
var runAllTestsInSingleProcess = makeSingleProcess(runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, makeExit);
module.exports = function findTestsAndRunThem(runObj, runOnce, $order) {
    debugger;
    if (_suman.sumanOpts.errors_only) {
        resultBroadcaster.emit(String(events.ERRORS_ONLY_OPTION));
    }
    delete process.env.SUMAN_EXTRANEOUS_EXECUTABLE;
    runnerObj.handleBlocking = make_handle_blocking_1.default(mapValues($order, function (val) {
        val.testPath = path.resolve(projectRoot + '/' + val.testPath);
        return val;
    }));
    process.nextTick(function () {
        var args = fnArgs(runOnce);
        var ret = runOnce.apply(null, integrantInjector(args));
        if (ret.dependencies) {
            if (typeof ret.dependencies === 'object' && !Array.isArray(ret.dependencies)) {
                runnerObj.depContainerObj = ret.dependencies;
            }
            else {
                throw new Error(' => suman.once.pre.js file does not export an object with a property called "dependencies".');
            }
        }
        else {
            console.error(' => Warning, no dependencies object exported from suman.once.pre.js file => \n' +
                'here is the returned contents =>\n', util.inspect(ret));
        }
        resultBroadcaster.emit(String(events.RUNNER_ASCII_LOGO), ascii.suman_runner);
        if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
            runAllTestsInSingleProcess(runObj);
        }
        else if (runObj) {
            runSingleOrMultipleDirs(runObj);
        }
        else {
            throw new Error(' => Suman implementation error => Please report.');
        }
    });
};
