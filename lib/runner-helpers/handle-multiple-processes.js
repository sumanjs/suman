'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var fs = require("fs");
var path = require("path");
var util = require("util");
var EE = require("events");
var semver = require("semver");
var merge = require('lodash.merge');
var shuffle = require('lodash.shuffle');
var suman_events_1 = require("suman-events");
var suman_utils_1 = require("suman-utils");
var async = require("async");
var noFilesFoundError = require('../helpers/no-files-found-error');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var runnerUtils = require('./runner-utils');
var socket_cp_hash_1 = require("./socket-cp-hash");
var getTapParser = require('./handle-tap').getTapParser;
var getTapJSONParser = require('./handle-tap-json').getTapJSONParser;
var constants = require('../../config/suman-constants').constants;
var debug = require('suman-debug')('s:runner');
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var multiple_process_each_on_exit_1 = require("./multiple-process-each-on-exit");
var prepend_transform_1 = require("prepend-transform");
var runChildPath = require.resolve(__dirname + '/run-child.js');
var uuidV4 = require("uuid/v4");
exports.makeHandleMultipleProcesses = function (runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit) {
    return function (runObj) {
        debugger;
        _suman.startDateMillis = Date.now();
        var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, maxProcs = _suman.maxProcs, projectRoot = _suman.projectRoot;
        var waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;
        _suman.log('waitForAllTranformsToFinish => ', chalk.magenta(waitForAllTranformsToFinish));
        var args = ['--user-args', sumanOpts.user_args];
        var queuedTestFns = [];
        var failedTransformObjects = [];
        var transpileQueue = async.queue(function (task, cb) {
            task(function (err, file, shortFile, stdout, stderr, gd) {
                setImmediate(cb);
                if (err) {
                    _suman.logError('tranpile error => ', err.stack || err);
                    failedTransformObjects.push({ err: err, file: file, shortFile: shortFile, stdout: stdout, stderr: stderr });
                    return;
                }
                if (waitForAllTranformsToFinish) {
                    queuedTestFns.push(function () {
                        outer(file, shortFile, stdout, gd);
                    });
                }
                else {
                    outer(file, shortFile, stdout, gd);
                }
            });
        }, 3);
        if (waitForAllTranformsToFinish) {
            transpileQueue.drain = function () {
                _suman.log('all transforms complete, beginning to run first set of tests.');
                queuedTestFns.forEach(function (fn) {
                    fn();
                });
            };
        }
        if (sumanOpts.$useTAPOutput) {
            if (sumanOpts.verbosity > 4) {
                _suman.log(chalk.gray.bold('Suman runner is expecting TAP output from Node.js child processes ' +
                    'and will not be listening for websocket messages.'));
            }
        }
        var handleBlocking = runnerObj.handleBlocking;
        if (_suman.usingLiveSumanServer) {
            args.push('--live_suman_server');
        }
        var files = runObj.files;
        resultBroadcaster.emit(String(suman_events_1.events.RUNNER_STARTED), files.length);
        if (_suman.sumanOpts.rand) {
            files = shuffle(files);
        }
        runnerObj.startTime = Date.now();
        var fileObjArray = suman_utils_1.default.removeSharedRootPath(files);
        var sumanEnv = Object.assign({}, process.env, {
            SUMAN_RUN_CHILD_STATIC_PATH: runChildPath,
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
        var execFile = path.resolve(__dirname + '/run-child.js');
        var istanbulExecPath = _suman.istanbulExecPath || 'istanbul';
        var isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
        var isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
        fileObjArray.forEach(function (fileShortAndFull) {
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
            tableRows[shortFile] = {
                actualExitCode: null,
                shortFilePath: shortFile,
                tableData: null,
                defaultTableData: {
                    SUITES_DESIGNATOR: basename
                }
            };
            var gd = socket_cp_hash_1.ganttHash[uuid] = {
                uuid: uuid,
                fullFilePath: String(file),
                shortFilePath: String(shortFile),
                filePathFromProjectRoot: String(filePathFromProjectRoot),
            };
            var tr = (sumanOpts.no_transpile !== true) && runnerUtils.findPathOfTransformDotSh(file);
            if (tr) {
                _suman.log(chalk.bgWhite.underline('Suman has found a @transform.sh file => '), chalk.bold(tr));
                transpileQueue.push(function (cb) {
                    suman_utils_1.default.makePathExecutable(tr, function (err) {
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
                        if (sumanOpts.inherit_all_stdio || sumanOpts.inherit_transform_stdio || process.env.SUMAN_INHERIT_STDIO) {
                            var onError = function (e) {
                                console.error('\n', e.stack || e, '\n');
                            };
                            k.stderr.pipe(prepend_transform_1.default(" [" + chalk.red('transform process stderr:') + " " + chalk.red.bold(String(file.slice(ln))) + "] "))
                                .on('error', onError).pipe(process.stderr).on('error', onError);
                            k.stdout.pipe(prepend_transform_1.default(" [" + chalk.yellow('transform process stdout:') + " " + chalk.gray.bold(String(file.slice(ln))) + "] "))
                                .on('error', onError).pipe(process.stdout).on('error', onError);
                        }
                        var stdout = '';
                        k.stdout.on('data', function (data) {
                            stdout += data;
                        });
                        var stderr = '';
                        k.stderr.on('data', function (data) {
                            stderr += data;
                        });
                        k.once('close', function (code) {
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
        });
        var childId = 1;
        var outer = function (file, shortFile, stdout, gd) {
            var run = function () {
                if (runnerObj.bailed) {
                    if (sumanOpts.verbosity > 4) {
                        console.log(' => Suman => "--bailed" option was passed and was tripped, ' +
                            'no more child processes will be forked.');
                    }
                    return;
                }
                var argz = JSON.parse(JSON.stringify(args));
                var execArgz = ['--expose-gc'];
                if (sumanOpts.debug_child) {
                    execArgz.push('--debug-brk');
                    execArgz.push('--debug=' + (5303 + runnerObj.processId++));
                }
                if (sumanOpts.inspect_child) {
                    if (semver.gt(process.version, '7.8.0')) {
                        execArgz.push('--inspect-brk');
                    }
                    else {
                        execArgz.push('--inspect');
                        execArgz.push('--debug-brk');
                    }
                }
                var execArgs;
                if (execArgs = sumanOpts.exec_arg) {
                    execArgs.forEach(function (n) {
                        if (n) {
                            execArgz.push(String(n).trim());
                        }
                    });
                    String(execArgs).split(/S+/).forEach(function (n) {
                        if (n) {
                            execArgz.push('--' + String(n).trim());
                        }
                    });
                }
                var $execArgz = execArgz.filter(function (e, i) {
                    if (execArgz.indexOf(e) !== i) {
                        console.error('\n', chalk.yellow(' => Warning you have duplicate items in your exec args => '), '\n' + util.inspect(execArgz), '\n');
                    }
                    return true;
                });
                var n, hashbang = false;
                var extname = path.extname(shortFile);
                var $childId = childId++;
                var inherit = _suman.$forceInheritStdio ? 'inherit' : '';
                if (inherit) {
                    _suman.log('we are inheriting stdio of child, because of sumanception.');
                }
                var cpOptions = {
                    detached: false,
                    cwd: projectRoot,
                    stdio: [
                        'ignore',
                        inherit || (isStdoutSilent ? 'ignore' : 'pipe'),
                        inherit || (isStderrSilent ? 'ignore' : 'pipe'),
                        'ipc'
                    ],
                    env: Object.assign({}, sumanEnv, {
                        SUMAN_CHILD_TEST_PATH: file,
                        SUMAN_CHILD_TEST_PATH_TARGET: file,
                        SUMAN_TRANSFORM_STDOUT: stdout,
                        SUMAN_CHILD_ID: String($childId)
                    })
                };
                var sh = runnerUtils.findPathOfRunDotSh(file);
                if (sh) {
                    _suman.log(chalk.bgWhite.underline('Suman has found a @run.sh file => '), chalk.bold(sh));
                    cpOptions.cwd = projectRoot;
                    try {
                        fs.chmodSync(sh, 511);
                    }
                    catch (err) {
                    }
                    if (sumanOpts.coverage) {
                        _suman.logWarning(chalk.magenta('coverage option was set to true, but we are running your tests via @run.sh.'));
                        _suman.logWarning(chalk.magenta('so in this case, you will need to run your coverage call via @run.sh.'));
                    }
                    n = cp.spawn(sh, argz, cpOptions);
                }
                else {
                    if ('.js' === extname) {
                        if (sumanOpts.coverage) {
                            var coverageDir = path.resolve(_suman.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
                            n = cp.spawn(istanbulExecPath, ['cover', execFile, '--dir', coverageDir, '--'].concat(args), cpOptions);
                        }
                        else {
                            argz.unshift(execFile);
                            var argzz = $execArgz.concat(argz);
                            n = cp.spawn('node', argzz, cpOptions);
                        }
                    }
                    else {
                        console.log('perl bash python or ruby file ? => ', file);
                        hashbang = true;
                        n = cp.spawn(file, argz, cpOptions);
                    }
                }
                socket_cp_hash_1.cpHash[$childId] = n;
                if (!_suman.weAreDebugging) {
                    n.to = setTimeout(function () {
                        console.error(' => Suman killed child process because it timed out => \n', (n.fileName || n.filename));
                        n.kill('SIGINT');
                        setTimeout(function () {
                            n.kill('SIGKILL');
                        }, 18000);
                    }, 6000000);
                }
                n.testPath = file;
                n.shortTestPath = shortFile;
                forkedCPs.push(n);
                n.on('message', function (msg) {
                    _suman.logError('Suman runner does not handle standard Node.js IPC messages.');
                });
                n.on('error', function (err) {
                    _suman.logError('error spawning child process => ', console.error(err.stack || err));
                    if (hashbang) {
                        console.error('\n');
                        console.error(' => The supposed test script file with the following path may not have a hashbang => ');
                        console.error(chalk.magenta.bold(file));
                        console.error(' => A hashbang is necessary for non-.js files and when there is no accompanying @run.sh file.');
                        console.error(' => Without a hashbang, Suman (and your OS) will not know how to run the file.');
                        console.error(' => See sumanjs.org for more information.');
                    }
                });
                if (n.stdio && n.stdout && n.stderr) {
                    if (inherit) {
                        _suman.logError('n.stdio is defined even though we are in sumanception territory.');
                    }
                    n.stdout.setEncoding('utf8');
                    n.stderr.setEncoding('utf8');
                    if (sumanOpts.inherit_stdio || sumanOpts.inherit_all_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes') {
                        var onError = function (e) {
                            console.error('\n', e.stack || e, '\n');
                        };
                        n.stdout.pipe(prepend_transform_1.default(chalk.cyan(' => [suman child stdout] => ')))
                            .on('error', onError).pipe(process.stdout).on('error', onError);
                        n.stderr.pipe(prepend_transform_1.default(chalk.red.bold(' => [suman child stderr] => ')))
                            .on('error', onError).pipe(process.stderr).on('error', onError);
                    }
                    if (true || sumanOpts.$useTAPOutput) {
                        n.tapOutputIsComplete = false;
                        n.stdout.pipe(getTapJSONParser())
                            .on('error', function (e) {
                            _suman.logError('error parsing TAP JSON output => ', e.stack || e);
                        })
                            .once('finish', function () {
                            n.tapOutputIsComplete = true;
                            process.nextTick(function () {
                                n.emit('tap-output-is-complete', true);
                            });
                        });
                    }
                    n.stdio[2].setEncoding('utf-8');
                    n.stdio[2].on('data', function (data) {
                        var d = String(data).split('\n').filter(function (line) {
                            return String(line).length;
                        }).map(function (line) {
                            return '[' + n.shortTestPath + '] ' + line;
                        }).join('\n');
                        _suman.sumanStderrStream.write('\n\n');
                        _suman.sumanStderrStream.write(d);
                        if (_suman.weAreDebugging) {
                            console.log('pid => ', n.pid, 'stderr => ', d);
                        }
                    });
                }
                else {
                    if (suman_utils_1.default.vgt(2)) {
                        _suman.logWarning('Stdio object not available for child process.');
                    }
                }
                n.dateStartedMillis = gd.startDate = Date.now();
                n.once('exit', multiple_process_each_on_exit_1.default(n, runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, gd));
            };
            run.testPath = file;
            run.shortTestPath = shortFile;
            if (handleBlocking.runNext(run)) {
                if (suman_utils_1.default.vgt(3) || suman_utils_1.default.isSumanDebug()) {
                    _suman.log('File has just started running =>', file, '\n');
                }
            }
            else {
                runnerObj.queuedCPs.push(run);
                _suman.log('File is blocked by Suman runner =>', file);
                if (suman_utils_1.default.isSumanDebug()) {
                    _suman.log('File is blocked by Suman runner =>', file);
                }
            }
            if (waitForAllTranformsToFinish) {
                if (forkedCPs.length < 1 && runnerObj.queuedCPs.length > 0) {
                    throw new Error(' => Suman internal error => fatal start order algorithm error, ' +
                        'please file an issue on Github, thanks.');
                }
                if (forkedCPs.length < 1) {
                    noFilesFoundError(files);
                }
                else {
                    var totalCount = forkedCPs.length + runnerObj.queuedCPs.length;
                    var suites = totalCount === 1 ? 'suite' : 'suites';
                    var processes = totalCount === 1 ? 'process' : 'processes';
                    resultBroadcaster.emit(String(suman_events_1.events.RUNNER_INITIAL_SET), forkedCPs, processes, suites);
                    var addendum = maxProcs < totalCount ? ' with no more than ' + maxProcs + ' running at a time.' : '';
                    resultBroadcaster.emit(String(suman_events_1.events.RUNNER_OVERALL_SET), totalCount, processes, suites, addendum);
                }
            }
        };
    };
};
