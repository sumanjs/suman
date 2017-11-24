'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var fs = require('fs');
var replaceStrm = require('replacestream');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var callable = true;
exports.run = function (filePath) {
    if (!callable) {
        return;
    }
    callable = false;
    if (process.env.MAKE_SUMAN_LOG !== 'no') {
        if (su.vgt(6)) {
            _suman.log.info('we are logging child stdout/stderr to files.', '\n');
        }
        var timestamp = process.env.SUMAN_RUNNER_TIMESTAMP;
        var runId = process.env.SUMAN_RUN_ID;
        var logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
        var sumanCPLogs = path.resolve(logsDir + '/runs/');
        var f = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
        if (SUMAN_SINGLE_PROCESS) {
            _suman.log.error('\n');
            _suman.log.error('in SUMAN_SINGLE_PROCESS mode, and we are not currently configured to log stdio to log file.');
            _suman.log.error('\n');
            return;
        }
        var isDeleteFile_1 = true, writeToFileStream_1 = true;
        var temp = su.removePath(filePath, _suman.projectRoot);
        var onlyFile = String(temp).replace(/\//g, '.');
        var logfile_1 = path.resolve(f + '/' + onlyFile + '.log');
        var rstrm = replaceStrm(/\[\d{1,2}(;\d{1,2})?m/g, '');
        var strm_1 = rstrm.pipe(fs.createWriteStream(logfile_1));
        strm_1.on('error', function (e) {
            _suman.log.error(e.stack || e);
        });
        _suman.endLogStream = function () {
            writeToFileStream_1 = false;
            strm_1.end('this is the end of the Suman test stream.\n');
        };
        strm_1.on('drain', function () {
            _suman.isStrmDrained = true;
            _suman.drainCallback && _suman.drainCallback(logfile_1);
        });
        if (true || _suman.sumanConfig.isLogChildStderr) {
            var stderrWrite_1 = process.stderr.write;
            process.stderr.write = function () {
                _suman.isStrmDrained = false;
                isDeleteFile_1 = false;
                if (writeToFileStream_1) {
                    strm_1.write.apply(strm_1, arguments);
                }
                stderrWrite_1.apply(process.stderr, arguments);
            };
        }
        fs.appendFileSync(logfile_1, ' => Beginning of debug log for test with full path => \n' + filePath + '\n');
        if (true || _suman.sumanConfig.isLogChildStdout) {
            var stdoutWrite_1 = process.stdout.write;
            process.stdout.write = function () {
                _suman.isStrmDrained = false;
                isDeleteFile_1 = false;
                if (writeToFileStream_1) {
                    strm_1.write.apply(strm_1, arguments);
                }
                stdoutWrite_1.apply(process.stdout, arguments);
            };
        }
        process.once('exit', function () {
            if (isDeleteFile_1 && false) {
                try {
                    fs.unlinkSync(logfile_1);
                }
                catch (err) {
                    _suman.log.error(' => Could not unlink extraneous log file at path => ', logfile_1);
                }
            }
            else {
            }
        });
    }
};
