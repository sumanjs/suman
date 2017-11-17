'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var path = require("path");
var EE = require("events");
var merge = require('lodash.merge');
var shuffle = require('lodash.shuffle');
var suman_events_1 = require("suman-events");
var suman_utils_1 = require("suman-utils");
var async = require("async");
var noFilesFoundError = require('../helpers/no-files-found-error');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var runnerUtils = require('./runner-utils');
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var prepend_transform_1 = require("prepend-transform");
exports.makeContainerize = function (runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit) {
    return function (runObj) {
        _suman.startDateMillis = Date.now();
        var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, maxProcs = _suman.maxProcs, projectRoot = _suman.projectRoot, args = _suman.userArgs;
        var waitForAllTranformsToFinish = true;
        var failedTestObjects = [];
        var queuedTestObjects = [];
        var transpileQueue = async.queue(function (task, cb) {
            task(function (err, file, shortFile, stdout, pathFromProjecRoot) {
                setImmediate(cb);
                if (err) {
                    _suman.log.error('tranpile error => ', suman_utils_1.default.getCleanErrorString(err));
                    failedTestObjects.push({ err: err, file: file, shortFile: shortFile, stdout: stdout, pathFromProjecRoot: pathFromProjecRoot });
                }
                else {
                    queuedTestObjects.push({ file: file, shortFile: shortFile, stdout: stdout, pathFromProjecRoot: pathFromProjecRoot });
                }
            });
        }, 4);
        transpileQueue.drain = function () {
            _suman.log.info('all transforms complete, beginning to run first set of tests.');
            var p = path.resolve(__dirname + '/../dockerize/make-dockerized-tests.sh');
            var files = queuedTestObjects.map(function (v) {
                if (String(v.pathFromProjecRoot).startsWith('/')) {
                    return String(v.pathFromProjecRoot).slice(1);
                }
                return v.pathFromProjecRoot;
            });
            console.log('short files => ', files);
            var filesStr = files.join(' ');
            console.log('short filesStr => ', filesStr);
            var k = cp.spawn(p, [filesStr, '--no-transpile']);
            k.stdout.pipe(process.stdout);
            k.stderr.pipe(process.stderr);
            k.once('exit', function (code) {
                console.log('containerized tests exitted with code => ', code);
                process.exit(code);
            });
        };
        if (sumanOpts.$useTAPOutput) {
            if (sumanOpts.verbosity > 7) {
                _suman.log.info(chalk.gray.bold('Suman runner is expecting TAP output from Node.js child processes ' +
                    'and will not be listening for IPC messages.'));
            }
        }
        var files = runObj.files;
        resultBroadcaster.emit(String(suman_events_1.events.RUNNER_STARTED), files.length);
        if (_suman.sumanOpts.rand) {
            files = shuffle(files);
        }
        runnerObj.startTime = Date.now();
        var fileObjArray = suman_utils_1.default.removeSharedRootPath(files);
        var sumanEnv = Object.assign({}, process.env, {
            SUMAN_CONFIG: JSON.stringify(sumanConfig),
            SUMAN_OPTS: JSON.stringify(sumanOpts),
            SUMAN_RUNNER: 'yes',
            SUMAN_RUN_ID: _suman.runId,
            SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
            NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes')
        });
        if (_suman.socketServerPort > 0) {
            sumanEnv['SUMAN_SOCKETIO_SERVER_PORT'] = _suman.socketServerPort;
        }
        fileObjArray.forEach(function (fileShortAndFull) {
            var file = fileShortAndFull[0];
            var shortFile = fileShortAndFull[1];
            console.log('fileShortAndFull', fileShortAndFull);
            var pathFromRoot = fileShortAndFull[2];
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
            tableRows[shortFile] = {
                actualExitCode: null,
                shortFilePath: shortFile,
                tableData: null,
                defaultTableData: {
                    SUITES_DESIGNATOR: basename
                }
            };
            var tr = runnerUtils.findPathOfTransformDotSh(file);
            if (tr) {
                transpileQueue.push(function (cb) {
                    suman_utils_1.default.makePathExecutable(tr, function (err) {
                        if (err) {
                            return cb(err);
                        }
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
                        if (sumanOpts.inherit_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes') {
                            var onError = function (e) {
                                console.error('\n', suman_utils_1.default.getCleanErrorString(e), '\n');
                            };
                            k.stderr.pipe(prepend_transform_1.pt(chalk.red('=> transform process stderr => ') + " " + file + "\n", { omitWhitespace: true }))
                                .on('error', onError).pipe(process.stderr).on('error', onError);
                            k.stdout.pipe(prepend_transform_1.pt(" => transform process stdout => " + file + "\n"))
                                .on('error', onError).pipe(process.stdout).on('error', onError);
                        }
                        var stdout = '';
                        k.stdout.on('data', function (data) {
                            stdout += data;
                        });
                        k.once('close', function (code) {
                            if (code > 0) {
                                cb(new Error("the @transform.sh process, for file " + file + ",\nexitted with non-zero exit code. :(\n                   \n To see the stderr, use --inherit-stdio."));
                            }
                            else {
                                cb(null, file, shortFile, stdout, pathFromRoot);
                            }
                        });
                    });
                });
            }
            else {
                transpileQueue.unshift(function (cb) {
                    setImmediate(function () {
                        cb(null, file, shortFile, '', pathFromRoot);
                    });
                });
            }
        });
    };
};
