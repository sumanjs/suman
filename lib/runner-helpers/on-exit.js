'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var EE = require("events");
var chalk = require("chalk");
var events = require('suman-events').events;
var _suman = global.__suman = global.__suman || {};
var resultBroadcaster = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();
exports.onExit = function (code) {
    if (code > 0) {
        resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE_GREATER_THAN_ZERO), code);
    }
    else {
        resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE_IS_ZERO));
    }
    if (code > 0) {
        var logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
        var sumanCPLogs = path.resolve(logsDir + '/runs/');
        var logsPath = path.resolve(sumanCPLogs + '/' + _suman.timestamp + '-' + _suman.runId);
        console.log('\n', ' => At least one test experienced an error => View the test logs => ', '\n', chalk.yellow.bold(logsPath), '\n');
    }
    resultBroadcaster.emit(String(events.RUNNER_EXIT_CODE), code);
    fs.appendFileSync(_suman.sumanRunnerStderrStreamPath, '\n\n### Suman runner end ###\n\n');
};
