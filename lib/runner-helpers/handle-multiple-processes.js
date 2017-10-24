'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var EE = require("events");
var shuffle = require('lodash.shuffle');
var suman_events_1 = require("suman-events");
var su = require("suman-utils");
var noFilesFoundError = require('../helpers/no-files-found-error');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var socket_cp_hash_1 = require("./socket-cp-hash");
var constants = require('../../config/suman-constants').constants;
var add_to_transpile_queue_1 = require("./multi-process/add-to-transpile-queue");
var multiple_process_each_on_exit_1 = require("./multiple-process-each-on-exit");
var add_to_run_queue_1 = require("./multi-process/add-to-run-queue");
var queues_1 = require("./shared/queues");
exports.makeHandleMultipleProcesses = function (runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit) {
    return function (runObj) {
        var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, projectRoot = _suman.projectRoot;
        _suman.startDateMillis = Date.now();
        process.stderr.setMaxListeners(runObj.files.length + 11);
        process.stdout.setMaxListeners(runObj.files.length + 11);
        var logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
        var sumanCPLogs = path.resolve(logsDir + '/runs/');
        var f = path.resolve(sumanCPLogs + '/' + _suman.timestamp + '-' + _suman.runId);
        var args = ['--user-args', sumanOpts.user_args];
        var runQueue = queues_1.makeRunQueue();
        var onExitFn = multiple_process_each_on_exit_1.makeOnExitFn(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, runQueue);
        var runFile = add_to_run_queue_1.makeAddToRunQueue(runnerObj, args, runQueue, projectRoot, socket_cp_hash_1.cpHash, forkedCPs, onExitFn);
        var waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;
        if (waitForAllTranformsToFinish) {
            _suman.log.info('waitForAllTranformsToFinish => ', chalk.magenta(waitForAllTranformsToFinish));
        }
        var queuedTestFns = [];
        var failedTransformObjects = [];
        var transpileQueue = queues_1.makeTranspileQueue(failedTransformObjects, runFile, queuedTestFns);
        if (waitForAllTranformsToFinish) {
            transpileQueue.drain = function () {
                _suman.log.info('all transforms complete, beginning to run first set of tests.');
                queuedTestFns.forEach(function (fn) {
                    fn();
                });
            };
        }
        if (sumanOpts.$useTAPOutput) {
            if (sumanOpts.verbosity > 4) {
                _suman.log.info(chalk.gray.bold('Suman runner is expecting TAP output from Node.js child processes ' +
                    'and will not be listening for websocket messages.'));
            }
        }
        var files = runObj.files;
        resultBroadcaster.emit(String(suman_events_1.events.RUNNER_STARTED), files.length);
        if (_suman.sumanOpts.rand) {
            files = shuffle(files);
        }
        runnerObj.startTime = Date.now();
        var fileObjArray = su.removeSharedRootPath(files);
        fileObjArray.forEach(add_to_transpile_queue_1.makeAddToTranspileQueue(f, transpileQueue, tableRows, socket_cp_hash_1.ganttHash, projectRoot));
    };
};
