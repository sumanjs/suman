'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
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
var path = require("path");
var util = require("util");
var EE = require("events");
var fnArgs = require('function-arguments');
var mapValues = require('lodash.mapvalues');
var chalk = require("chalk");
var a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;
var suman_events_1 = require("suman-events");
var suman_utils_1 = require("suman-utils");
var debug = require('suman-debug')('s:runner');
var _suman = global.__suman = (global.__suman || {});
var integrant_injector_1 = require("./injection/integrant-injector");
var suman_constants_1 = require("../config/suman-constants");
var ascii = require('./helpers/ascii');
var make_handle_blocking_1 = require("./runner-helpers/make-handle-blocking");
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var handle_fatal_message_1 = require("./runner-helpers/handle-fatal-message");
var log_test_result_1 = require("./runner-helpers/log-test-result");
var onExit = require('./runner-helpers/on-exit').onExit;
var make_exit_1 = require("./runner-helpers/make-exit");
var makeHandleIntegrantInfo = require('./runner-helpers/handle-integrant-info').makeHandleIntegrantInfo;
var make_before_exit_once_post_1 = require("./runner-helpers/make-before-exit-once-post");
var makeSingleProcess = require('./runner-helpers/handle-single-process');
var makeContainerize = require('./runner-helpers/handle-containerize').makeContainerize;
var handle_multiple_processes_1 = require("./runner-helpers/handle-multiple-processes");
var IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var socketio_server_1 = require("./runner-helpers/socketio-server");
var socket_cp_hash_1 = require("./runner-helpers/socket-cp-hash");
var messages = [];
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
var handleIntegrantInfo = makeHandleIntegrantInfo(runnerObj, allOncePostKeys);
var exit = make_exit_1.makeExit(runnerObj, tableRows);
var beforeExitRunOncePost = make_before_exit_once_post_1.makeBeforeExit(runnerObj, oncePosts, allOncePostKeys);
{
    _suman.isActualExitHandlerRegistered = true;
    process.once('exit', onExit);
}
process.on('error', function (e) {
    _suman.logError(chalk.magenta('Whoops! "error" event in runner process:') + " \n " + chalk.bold(suman_utils_1.default.getCleanErrorString(e)));
});
process.once('uncaughtException', function (e) {
    _suman.logError(chalk.magenta('Suman runner "uncaughtException" event:') + " \n " + chalk.bold(suman_utils_1.default.getCleanErrorString(e)));
    process.exit(1);
});
process.on('message', function (data) {
    _suman.logError('Weird! => Suman runner received an IPC message:\n', chalk.magenta(typeof data === 'string' ? data : util.inspect(data)));
});
var server = socketio_server_1.getSocketServer();
var INTEGRANT_INFO = suman_constants_1.constants.runner_message_type.INTEGRANT_INFO;
var TABLE_DATA = suman_constants_1.constants.runner_message_type.TABLE_DATA;
var LOG_RESULT = suman_constants_1.constants.runner_message_type.LOG_RESULT;
var FATAL = suman_constants_1.constants.runner_message_type.FATAL;
var FATAL_MESSAGE_RECEIVED = suman_constants_1.constants.runner_message_type.FATAL_MESSAGE_RECEIVED;
var handleTableData = function (n, data, s) {
    runnerObj.tableCount++;
    tableRows[n.shortTestPath].tableData = data;
    s.emit(TABLE_DATA, { info: 'table-data-received' });
};
server.on('connection', function (socket) {
    socket.on(INTEGRANT_INFO, function (data) {
        var id = data.childId;
        var n = socket_cp_hash_1.cpHash[id];
        handleIntegrantInfo(data, n, socket);
    });
    socket.on(FATAL, function (msg) {
        var id = msg.childId;
        var n = socket_cp_hash_1.cpHash[id];
        socket.emit(FATAL_MESSAGE_RECEIVED, true);
        handle_fatal_message_1.handleFatalMessage(msg.data, n, socket);
    });
    socket.on(TABLE_DATA, function (msg) {
        var id = msg.childId;
        var n = socket_cp_hash_1.cpHash[id];
        handleTableData(n, msg.data, socket);
    });
    socket.on(LOG_RESULT, function (msg) {
        var id = msg.childId;
        var n = socket_cp_hash_1.cpHash[id];
        log_test_result_1.logTestResult(msg, n, socket);
    });
});
function handleMessageForSingleProcess(msg, n) {
    switch (msg.type) {
        case suman_constants_1.constants.runner_message_type.TABLE_DATA:
            break;
        case suman_constants_1.constants.runner_message_type.INTEGRANT_INFO:
            handleIntegrantInfo(msg, n);
            break;
        case suman_constants_1.constants.runner_message_type.LOG_RESULT:
            log_test_result_1.logTestResult(msg, n);
            break;
        case suman_constants_1.constants.runner_message_type.FATAL:
            n.send({ info: 'fatal-message-received' });
            handle_fatal_message_1.handleFatalMessage(msg.data, n);
            break;
        case suman_constants_1.constants.runner_message_type.NON_FATAL_ERR:
            console.error('\n\n ' + chalk.red('non-fatal suite error: ' + msg.msg + '\n'));
            break;
        case suman_constants_1.constants.runner_message_type.MAX_MEMORY:
            console.log('\nmax memory: ' + util.inspect(msg.msg));
            break;
        default:
            throw new Error(' => Suman internal error => bad msg.type in runner');
    }
}
function handleMessage(msg, n) {
    switch (msg.type) {
        case suman_constants_1.constants.runner_message_type.TABLE_DATA:
            handleTableData(n, msg.data);
            break;
        case suman_constants_1.constants.runner_message_type.INTEGRANT_INFO:
            handleIntegrantInfo(msg, n);
            break;
        case suman_constants_1.constants.runner_message_type.LOG_RESULT:
            log_test_result_1.logTestResult(msg, n);
            break;
        case suman_constants_1.constants.runner_message_type.FATAL:
            n.send({ info: 'fatal-message-received' });
            handle_fatal_message_1.handleFatalMessage(msg.data, n);
            break;
        case suman_constants_1.constants.runner_message_type.WARNING:
            console.error('\n\n ' + chalk.bgYellow('Suman warning: ' + msg.msg + '\n'));
            break;
        case suman_constants_1.constants.runner_message_type.NON_FATAL_ERR:
            console.error('\n\n ' + chalk.red('non-fatal suite error: ' + msg.msg + '\n'));
            break;
        default:
            throw new Error(' => Suman implementation error => Bad msg.type in runner, perhaps the user sent a message with process.send?');
    }
}
var runSingleOrMultipleDirs = handle_multiple_processes_1.makeHandleMultipleProcesses(runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, exit);
var runAllTestsInSingleProcess = makeSingleProcess(runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, exit);
var runAllTestsInContainer = makeContainerize(runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, exit);
exports.findTestsAndRunThem = function (runObj, runOnce, $order) {
    debugger;
    var sumanOpts = _suman.sumanOpts;
    if (sumanOpts.errors_only) {
        resultBroadcaster.emit(String(suman_events_1.events.ERRORS_ONLY_OPTION));
    }
    delete process.env.SUMAN_EXTRANEOUS_EXECUTABLE;
    var projectRoot = _suman.projectRoot || suman_utils_1.default.findProjectRoot(process.cwd());
    runnerObj.handleBlocking = make_handle_blocking_1.default(mapValues($order, function (val) {
        val.testPath = path.resolve(projectRoot + '/' + val.testPath);
        return val;
    }));
    process.nextTick(function () {
        var args = fnArgs(runOnce);
        var ret = runOnce.apply(null, integrant_injector_1.default(args));
        if (ret.dependencies) {
            if (suman_utils_1.default.isObject(ret.dependencies)) {
                runnerObj.depContainerObj = ret.dependencies;
            }
            else {
                throw new Error(' => suman.once.pre.js file does not export an object with a property called "dependencies".');
            }
        }
        else {
            _suman.logError('warning, no dependencies object exported from suman.once.pre.js file => \n' +
                'here is the returned contents =>\n', util.inspect(ret));
        }
        resultBroadcaster.emit(String(suman_events_1.events.RUNNER_ASCII_LOGO), ascii.suman_runner);
        if (IS_SUMAN_SINGLE_PROCESS) {
            runAllTestsInSingleProcess(runObj);
        }
        else if (sumanOpts.containerize) {
            runAllTestsInContainer(runObj);
        }
        else if (runObj) {
            runSingleOrMultipleDirs(runObj);
        }
        else {
            throw new Error('Suman implementation error => Switch fallthrough, please report.');
        }
    });
};
var $exports = module.exports;
exports.default = $exports;
