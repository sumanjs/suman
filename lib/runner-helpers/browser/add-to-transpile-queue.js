'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var cp = require("child_process");
var fs = require("fs");
var chalk = require("chalk");
var su = require("suman-utils");
var prepend_transform_1 = require("prepend-transform");
var uuidV4 = require("uuid/v4");
var _suman = global.__suman = (global.__suman || {});
var runner_utils_1 = require("../runner-utils");
exports.makeAddToTranspileQueue = function (f, transpileQueue, tableRows, ganttHash, projectRoot) {
    var sumanOpts = _suman.sumanOpts;
    var inheritTransformStdio = sumanOpts.inherit_all_stdio ||
        sumanOpts.inherit_transform_stdio || process.env.SUMAN_INHERIT_STDIO;
    return function (fileShortAndFull) {
        var uuid = String(uuidV4());
        var file = fileShortAndFull[0];
        var shortFile = fileShortAndFull[1];
        var filePathFromProjectRoot = fileShortAndFull[2];
        var basename = file.length > 28 ? ' ' + String(file).substring(Math.max(0, file.length - 28)) + ' ' : file;
        var m = String(basename).match(/\//g);
        if (m && m.length > 1) {
            var arr = String(basename).split('');
            var i = 0;
            while (arr[i] !== '/') {
                arr.shift();
            }
            basename = arr.join('');
        }
        tableRows[String(shortFile)] = {
            actualExitCode: null,
            shortFilePath: shortFile,
            tableData: null,
            defaultTableData: {
                SUITES_DESIGNATOR: basename
            }
        };
        var gd = ganttHash[uuid] = {
            uuid: uuid,
            fullFilePath: String(file),
            shortFilePath: String(shortFile),
            filePathFromProjectRoot: String(filePathFromProjectRoot),
        };
        var tr = (sumanOpts.no_transpile !== true) && runner_utils_1.findPathOfTransformDotSh(file);
        if (tr) {
            _suman.log.info(chalk.bgWhite.underline('Suman has found a @transform.sh file => '), chalk.bold(tr));
            transpileQueue.push(function (cb) {
                su.makePathExecutable(tr, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    gd.transformStartDate = Date.now();
                    var k = cp.spawn(tr, [], {
                        cwd: projectRoot,
                        env: Object.assign({}, process.env, {
                            SUMAN_TEST_PATHS: JSON.stringify([file]),
                            SUMAN_CHILD_TEST_PATH: file
                        })
                    });
                    k.once('error', cb);
                    k.stderr.setEncoding('utf8');
                    k.stdout.setEncoding('utf8');
                    var ln = String(_suman.projectRoot).length;
                    if (false) {
                        var onError = function (e) {
                            _suman.log.error('\n', su.getCleanErrorString(e), '\n');
                        };
                        var temp = su.removePath(file, _suman.projectRoot);
                        var onlyFile = String(temp).replace(/\//g, '.');
                        var logfile = path.resolve(f + '/' + onlyFile + '.log');
                        var fileStrm = fs.createWriteStream(logfile);
                        k.stderr.pipe(fileStrm).once('error', onError);
                        k.stdout.pipe(fileStrm).once('error', onError);
                    }
                    if (inheritTransformStdio) {
                        var onError = function (e) {
                            _suman.log.error('\n', su.getCleanErrorString(e), '\n');
                        };
                        var stderrPrepend = " [" + chalk.red('transform process stderr:') + " " + chalk.red.bold(String(file.slice(ln))) + "] ";
                        k.stderr.pipe(prepend_transform_1.pt(stderrPrepend, { omitWhitespace: true })).once('error', onError).pipe(process.stderr);
                        var stdoutPrepend = " [" + chalk.yellow('transform process stdout:') + " " + chalk.gray.bold(String(file.slice(ln))) + "] ";
                        k.stdout.pipe(prepend_transform_1.pt(stdoutPrepend)).once('error', onError).pipe(process.stdout);
                    }
                    var stdout = '';
                    k.stdout.on('data', function (data) {
                        stdout += data;
                    });
                    var stderr = '';
                    k.stderr.on('data', function (data) {
                        stderr += data;
                    });
                    k.once('exit', function (code) {
                        gd.transformEndDate = Date.now();
                        if (code > 0) {
                            cb(new Error("the @transform.sh process, for file " + file + ",\nexitted with non-zero exit code. :( \n                  \n To see the stderr, use --inherit-stdio."));
                        }
                        else {
                            cb(null, file, shortFile, stdout, stderr, gd);
                        }
                    });
                });
            });
        }
        else {
            gd.transformStartDate = gd.transformEndDate = null;
            gd.wasTransformed = false;
            transpileQueue.unshift(function (cb) {
                setImmediate(function () {
                    cb(null, file, shortFile, '', '', gd);
                });
            });
        }
    };
};
