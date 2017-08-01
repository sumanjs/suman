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
var constants = require('../../config/suman-constants').constants;
var debug = require('suman-debug')('s:runner');
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
function default_1(n, runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, gd) {
    return function (code, signal) {
        n.dateEndedMillis = gd.endDate = Date.now();
        n.sumanExitCode = gd.sumanExitCode = code;
        var sumanOpts = _suman.sumanOpts;
        var handleBlocking = runnerObj.handleBlocking;
        resultBroadcaster.emit(String(suman_events_1.events.TEST_FILE_CHILD_PROCESS_EXITED), {
            testPath: n.testPath,
            exitCode: code
        });
        if (su.isSumanDebug() || su.vgt(5)) {
            console.log('\n', chalk.black.bgYellow(' => process given by => ' +
                n.shortTestPath + ' exited with code: ' + code + ' '), '\n');
        }
        if (su.isSumanDebug()) {
            _suman.timeOfMostRecentExit = Date.now();
        }
        n.removeAllListeners();
        var originalExitCode = JSON.parse(JSON.stringify(code));
        if (n.expectedExitCode !== undefined) {
            if (code === n.expectedExitCode) {
                code = 0;
            }
        }
        runnerObj.doneCount++;
        messages.push({ code: code, signal: signal });
        tableRows[n.shortTestPath].actualExitCode = n.expectedExitCode !== undefined ?
            (n.expectedExitCode + '/' + originalExitCode) : originalExitCode;
        if ((runnerObj.bailed = (code > 0 && _suman.sumanOpts.bail)) ||
            (runnerObj.doneCount >= forkedCPs.length && runnerObj.queuedCPs.length < 1)) {
            if (runnerObj.bailed) {
                console.log('\n\n');
                console.log(chalk.magenta(' => Suman warning message => ' +
                    'We have ' + chalk.red.bold('bailed') + ' the test runner because a child process experienced an error ' +
                    'and exitted with a non-zero code.'));
                console.log(' => Since we have bailed, Suman will send a SIGTERM signal to any outstanding child processes.');
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
                    _suman.log(chalk.blue.bold.underline(' All scheduled child processes have exited.'));
                    console.log('\n');
                }
            }
            runnerObj.endTime = Date.now();
            runnerObj.listening = false;
            var waitForTAP = function () {
                async.parallel([
                    beforeExitRunOncePost,
                    function (cb) {
                        if (_suman.sumanOpts.coverage && !_suman.sumanOpts.no_report) {
                            console.log('\n');
                            console.log(chalk.blue.bold(' => Suman is running the Istanbul collated report.'));
                            console.log(chalk.blue.bold(' => To disable automatic report generation, use "--no-coverage-report".'));
                            var coverageDir = path.resolve(_suman.projectRoot + '/coverage');
                            var k_1 = cp.spawn(_suman.istanbulExecPath, ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'], {
                                cwd: _suman.projectRoot
                            });
                            k_1.stderr.pipe(process.stderr);
                            k_1.once('close', function (code) {
                                k_1.unref();
                                cb(code ? new Error(' => Test coverage exitted with non-zero exit code') : null, code);
                            });
                        }
                        else {
                            process.nextTick(cb);
                        }
                    }
                ], function (err) {
                    if (err) {
                        console.error(err.stack || err);
                    }
                    makeExit(messages, {
                        total: runnerObj.endTime - _suman.startTime,
                        runner: runnerObj.endTime - runnerObj.startTime
                    });
                });
            };
            if ('tapOutputIsComplete' in n) {
                if (n.tapOutputIsComplete === true) {
                    process.nextTick(waitForTAP);
                }
                else {
                    n.once('tap-output-is-complete', waitForTAP);
                }
            }
            else {
                process.nextTick(waitForTAP);
            }
        }
        else {
            handleBlocking.releaseNextTests(n.testPath, runnerObj);
            if (su.isSumanDebug()) {
                console.log(' => Time required to release next test(s) => ', Date.now() - _suman.timeOfMostRecentExit, 'ms');
            }
        }
    };
}
exports.default = default_1;
