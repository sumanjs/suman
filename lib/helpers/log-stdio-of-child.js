'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var fs = require('fs');
var replaceStrm = require('replacestream');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var su = require('suman-utils');
var callable = true;
module.exports = function (filePath) {
    if (!callable) {
        return;
    }
    callable = false;
    var timestamp = process.env.SUMAN_RUNNER_TIMESTAMP;
    var runId = process.env.SUMAN_RUN_ID;
    if (process.env.MAKE_SUMAN_LOG !== 'no') {
        var f = path.resolve(_suman.sumanHelperDirRoot + '/logs/runs/' + timestamp + '-' + runId);
        if (process.env.SUMAN_SINGLE_PROCESS) {
            console.error('\n', ' => Suman is in SINGLE_PROCESS_MODE and is not currently configured to log stdio to log file.', '\n');
        }
        else {
            var isDeleteFile_1 = true;
            var temp = su.removePath(filePath, _suman.projectRoot);
            var onlyFile = String(temp).replace(/\//g, '.');
            var logfile_1 = path.resolve(f + '/' + onlyFile + '.log');
            var strm_1 = replaceStrm(/\[[0-9][0-9]m/g, '').pipe(fs.createWriteStream(logfile_1));
            strm_1.on('drain', function () {
                _suman.isStrmDrained = true;
                if (_suman.drainCallback) {
                    console.log(' => DDDDDDDDDDRAIN.');
                    _suman.drainCallback(logfile_1);
                }
            });
            process.stderr.on('drain', function () {
                _suman.isStrmDrained = true;
                if (_suman.drainCallback) {
                    console.log(' => DDDDDDDDDDRAIN.');
                    _suman.drainCallback(logfile_1);
                }
            });
            if (_suman.sumanConfig.isLogChildStderr) {
                var stderrWrite_1 = process.stderr.write;
                process.stderr.write = function () {
                    _suman.isStrmDrained = false;
                    isDeleteFile_1 = false;
                    strm_1.write.apply(strm_1, arguments);
                    stderrWrite_1.apply(process.stderr, arguments);
                };
            }
            fs.appendFileSync(logfile_1, ' => Beginning of stderr log for test with full path => \n'
                + filePath + '\n');
            if (_suman.sumanConfig.isLogChildStdout) {
                var stdoutWrite_1 = process.stdout.write;
                process.stdout.write = function () {
                    _suman.isStrmDrained = false;
                    isDeleteFile_1 = false;
                    strm_1.write.apply(strm_1, arguments);
                    stdoutWrite_1.apply(process.stdout, arguments);
                };
            }
            process.once('exit', function () {
                if (isDeleteFile_1) {
                    try {
                        fs.unlinkSync(logfile_1);
                    }
                    catch (err) {
                        console.error(' => Could not unlink extraneous log file at path => ', logfile_1);
                    }
                }
                else {
                    fs.appendFileSync(logfile_1, ' => This is the end of the test.');
                }
            });
        }
    }
};
