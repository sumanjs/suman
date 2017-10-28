'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
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
var util = require("util");
var EE = require("events");
var fnArgs = require('function-arguments');
var mapValues = require('lodash.mapvalues');
var chalk = require("chalk");
var a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;
var suman_events_1 = require("suman-events");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var integrant_injector_1 = require("../injection/integrant-injector");
var suman_constants_1 = require("../../config/suman-constants");
var ascii = require("../helpers/ascii");
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var handle_fatal_message_1 = require("./handle-fatal-message");
var log_test_result_1 = require("./log-test-result");
var onExit = require('./on-exit').onExit;
var make_exit_1 = require("./make-exit");
var handle_integrant_info_1 = require("./handle-integrant-info");
var make_before_exit_once_post_1 = require("./make-before-exit-once-post");
var makeSingleProcess = require('./handle-single-process');
var makeContainerize = require('./handle-containerize').makeContainerize;
var makeHandleBrowserProcesses = require('./handle-browser').makeHandleBrowserProcesses;
var handle_multiple_processes_1 = require("./handle-multiple-processes");
var IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var socketio_server_1 = require("./socketio-server");
var socket_cp_hash_1 = require("./socket-cp-hash");
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
var handleIntegrantInfo = handle_integrant_info_1.makeHandleIntegrantInfo(runnerObj, allOncePostKeys);
var exit = make_exit_1.makeExit(runnerObj, tableRows);
var beforeExitRunOncePost = make_before_exit_once_post_1.makeBeforeExit(runnerObj, oncePosts, allOncePostKeys);
{
    _suman.isActualExitHandlerRegistered = true;
    process.once('exit', onExit);
}
process.on('error', function (e) {
    _suman.log.error(chalk.magenta('Whoops! "error" event in runner process:') + " \n " + chalk.bold(su.getCleanErrorString(e)));
});
process.once('uncaughtException', function (e) {
    debugger;
    _suman.log.error(chalk.magenta('Suman runner "uncaughtException" event:') + " \n " + chalk.bold(su.getCleanErrorString(e)));
    process.exit(1);
});
process.on('message', function (data) {
    debugger;
    _suman.log.error('Weird! => Suman runner received an IPC message:\n', chalk.magenta(typeof data === 'string' ? data : util.inspect(data)));
});
var INTEGRANT_INFO = suman_constants_1.constants.runner_message_type.INTEGRANT_INFO;
var TABLE_DATA = suman_constants_1.constants.runner_message_type.TABLE_DATA;
var LOG_RESULT = suman_constants_1.constants.runner_message_type.LOG_RESULT;
var FATAL = suman_constants_1.constants.runner_message_type.FATAL;
var FATAL_MESSAGE_RECEIVED = suman_constants_1.constants.runner_message_type.FATAL_MESSAGE_RECEIVED;
var BROWSER_FINISHED = suman_constants_1.constants.runner_message_type.BROWSER_FINISHED;
var handleTableData = function (n, data, s) {
    runnerObj.tableCount++;
    tableRows[n.shortTestPath].tableData = data;
    s.emit(TABLE_DATA, { info: 'table-data-received' });
};
exports.run = function (runObj, runOnce, $order) {
    debugger;
    var sumanOpts = _suman.sumanOpts;
    if (sumanOpts.errors_only) {
        rb.emit(String(suman_events_1.events.ERRORS_ONLY_OPTION));
    }
    var server = socketio_server_1.getSocketServer();
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
        socket.on(LOG_RESULT, function (msg, cb) {
            var id = msg.childId;
            var n = socket_cp_hash_1.cpHash[id];
            log_test_result_1.logTestResult(msg, n, socket);
            cb(null);
        });
        socket.on(BROWSER_FINISHED, function (msg, cb) {
            var id = String(msg.childId).trim();
            var exitCode = Number(String(msg.exitCode).trim());
            var n = socket_cp_hash_1.cpHash[id];
            n.sumanBrowserExitCode = exitCode;
            n.kill('SIGTERM');
            setTimeout(function () {
                if (!n.hasExited) {
                    n.kill('SIGINT');
                    setTimeout(function () {
                        !n.hasExited && n.kill('SIGKILL');
                    }, 1000);
                }
            }, 1000);
            cb(null);
        });
    });
    delete process.env.SUMAN_EXTRANEOUS_EXECUTABLE;
    process.nextTick(function () {
        var args = fnArgs(runOnce);
        var ret = runOnce.apply(null, integrant_injector_1.default(args, null));
        if (ret.dependencies) {
            if (su.isObject(ret.dependencies)) {
                runnerObj.depContainerObj = ret.dependencies;
            }
            else {
                throw new Error(' => suman.once.pre.js file does not export an object with a property called "dependencies".');
            }
        }
        else {
            _suman.log.error('warning, no dependencies object exported from suman.once.pre.js file => \n' +
                'here is the returned contents =>\n', util.inspect(ret));
        }
        rb.emit(String(suman_events_1.events.RUNNER_ASCII_LOGO), ascii.suman_runner);
        var fn;
        if (IS_SUMAN_SINGLE_PROCESS) {
            fn = makeSingleProcess(runnerObj, messages, beforeExitRunOncePost, exit);
        }
        else if (sumanOpts.containerize) {
            fn = makeContainerize(runnerObj, messages, beforeExitRunOncePost, exit);
        }
        else if (sumanOpts.browser) {
            fn = makeHandleBrowserProcesses(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, exit);
        }
        else if (runObj) {
            fn = handle_multiple_processes_1.makeHandleMultipleProcesses(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, exit);
        }
        else {
            throw new Error('Suman implementation error => Switch fallthrough, please report.');
        }
        fn(runObj);
    });
};
