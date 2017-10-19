'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var path = require('path');
var EE = require('events');
var merge = require('lodash.merge');
var shuffle = require('lodash.shuffle');
var suman_events_1 = require("suman-events");
var su = require("suman-utils");
var async = require("async");
var noFilesFoundError = require('../helpers/no-files-found-error');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var runnerUtils = require('./runner-utils');
var coverage_reporting_1 = require("./coverage-reporting");
var constants = require('../../config/suman-constants').constants;
var transpile_queue_1 = require("./multi-process/transpile-queue");
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeOnExitFn = function (runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, runQueue) {
    return function (n, gd, cb) {
        var weHaveBailed = function (code) {
            if (code > 0 && _suman.sumanOpts.bail) {
                return runnerObj.bailed = true;
            }
        };
        var allDone = function (q) {
            return q.length() < 1 && q.running() < 1;
        };
        return function (code, signal) {
            cb(null);
            n.dateEndedMillis = gd.endDate = Date.now();
            n.sumanExitCode = gd.sumanExitCode = code;
            n.removeAllListeners();
            var sumanOpts = _suman.sumanOpts;
            var transpileQueue = transpile_queue_1.getTranspileQueue();
            resultBroadcaster.emit(String(suman_events_1.events.TEST_FILE_CHILD_PROCESS_EXITED), {
                testPath: n.testPath,
                exitCode: code
            });
            if (su.isSumanDebug() || su.vgt(5)) {
                _suman.log(chalk.black.bgYellow("process given by => '" + n.shortTestPath + "' exited with code: " + code + " "));
            }
            if (su.isSumanDebug()) {
                _suman.timeOfMostRecentExit = Date.now();
            }
            var originalExitCode = code;
            if (n.expectedExitCode !== undefined) {
                if (code === n.expectedExitCode) {
                    code = 0;
                }
            }
            runnerObj.doneCount++;
            messages.push({ code: code, signal: signal });
            tableRows[n.shortTestPath].actualExitCode = n.expectedExitCode !== undefined ?
                (n.expectedExitCode + '/' + originalExitCode) : originalExitCode;
            if (weHaveBailed(code) || (allDone(runQueue) && allDone(transpileQueue))) {
                if (runnerObj.bailed) {
                    runQueue.kill();
                    transpileQueue.kill();
                    console.log('\n');
                    _suman.logError(chalk.magenta('We have ' + chalk.red.bold('bailed') +
                        ' the test runner because a child process experienced an error and exitted with a non-zero code.'));
                    _suman.logError(chalk.magenta('Since we have bailed, Suman will send a SIGTERM signal ' +
                        'to any outstanding child processes.'));
                    forkedCPs.forEach(function (n) {
                        n.kill('SIGTERM');
                        setTimeout(function () {
                            n.kill('SIGKILL');
                        }, 3000);
                    });
                }
                else {
                    if (sumanOpts.verbosity > 4) {
                        console.log('\n');
                        _suman.log(chalk.gray.bold.underline(' All scheduled child processes have exited.'));
                        console.log('\n');
                    }
                }
                runnerObj.endTime = Date.now();
                runnerObj.listening = false;
                var onTAPOutputComplete = function () {
                    var tasks = [
                        beforeExitRunOncePost,
                        coverage_reporting_1.handleTestCoverageReporting
                    ];
                    async.parallel(tasks, function (err) {
                        err && _suman.logError(err.stack || err);
                        makeExit(messages, {
                            total: runnerObj.endTime - _suman.startTime,
                            runner: runnerObj.endTime - runnerObj.startTime
                        });
                    });
                };
                if ('tapOutputIsComplete' in n) {
                    if (n.tapOutputIsComplete === true) {
                        process.nextTick(onTAPOutputComplete);
                    }
                    else {
                        n.once('tap-output-is-complete', onTAPOutputComplete);
                    }
                }
                else {
                    process.nextTick(onTAPOutputComplete);
                }
            }
        };
    };
};
