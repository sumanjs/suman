'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var fs = require("fs");
var path = require("path");
var util = require("util");
var EE = require("events");
var semver = require('semver');
var merge = require('lodash.merge');
var shuffle = require('lodash.shuffle');
var suman_events_1 = require("suman-events");
var suman_utils_1 = require("suman-utils");
var async = require("async");
var noFilesFoundError = require('../helpers/no-files-found-error');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var runnerUtils = require('./runner-utils');
var handleTap = require('./handle-tap');
var constants = require('../../config/suman-constants').constants;
var debug = require('suman-debug')('s:runner');
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var multiple_process_each_on_exit_1 = require("./multiple-process-each-on-exit");
var prepend_transform_1 = require("prepend-transform");
exports.makeHandleMultipleProcesses = function (runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit) {
    return function (runObj) {
        debugger;
        var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, maxProcs = _suman.maxProcs, projectRoot = _suman.projectRoot, args = _suman.userArgs;
        var waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;
        console.log('waitForAllTranformsToFinish => ', waitForAllTranformsToFinish);
        var queuedTestFns = [];
        var transpileQueue = async.queue(function (task, cb) {
            task(function (err, file, shortFile, stdout) {
                if (err) {
                    _suman.logError('tranpile error => ', err.stack || err);
                }
                setImmediate(cb);
                if (waitForAllTranformsToFinish) {
                    queuedTestFns.push(function () {
                        outer(file, shortFile, stdout);
                    });
                }
                else {
                    outer(file, shortFile, stdout);
                }
            });
        }, 8);
        if (waitForAllTranformsToFinish) {
            transpileQueue.drain = function () {
                _suman.log('all transforms complete, beginning to run first set of tests.');
                queuedTestFns.forEach(function (fn) {
                    fn();
                });
            };
        }
        if (sumanOpts.useTAPOutput) {
            if (sumanOpts.verbosity > 7) {
                console.log(colors.gray.bold(' => Suman runner is expecting TAP output from Node.js child processes ' +
                    'and will not be listening for IPC messages.'));
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
            SUMAN_CONFIG: JSON.stringify(sumanConfig),
            SUMAN_OPTS: JSON.stringify(sumanOpts),
            SUMAN_RUNNER: 'yes',
            SUMAN_RUN_ID: _suman.runId,
            SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
            NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes')
        });
        var execFile = path.resolve(__dirname + '/run-child.js');
        var istanbulExecPath = _suman.istanbulExecPath;
        var isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
        var isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
        fileObjArray.forEach(function (fileShortAndFull) {
            var file = fileShortAndFull[0];
            var shortFile = fileShortAndFull[1];
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
                    var k = cp.spawn(tr, [], {
                        env: Object.assign({}, process.env, {
                            SUMAN_TEST_PATHS: JSON.stringify([file])
                        })
                    });
                    k.once('error', cb);
                    k.stderr.setEncoding('utf8');
                    k.stdout.setEncoding('utf8');
                    var strm = fs.createWriteStream(path.resolve(tr + '.log'));
                    k.stderr.pipe(strm).on('error', function (e) {
                        throw e;
                    });
                    k.stdout.pipe(strm).on('error', function (e) {
                        throw e;
                    });
                    if (sumanOpts.inherit_stdio) {
                        k.stderr.pipe(process.stderr).on('error', function (e) {
                            throw e;
                        });
                        k.stdout.pipe(process.stdout).on('error', function (e) {
                            throw e;
                        });
                    }
                    var stdout = '';
                    k.stdout.on('data', function (data) {
                        stdout += data;
                    });
                    k.once('close', function (code) {
                        if (code > 0) {
                            cb(new Error("the @transform.sh process, for file " + file + ",\nexitted with non-zero exit code. :( \n To see the stderr, use --inherit-stdio."));
                        }
                        else {
                            cb(null, file, shortFile, stdout);
                        }
                    });
                });
            }
            else {
                transpileQueue.unshift(function (cb) {
                    setImmediate(function () {
                        cb(null, file, shortFile, '');
                    });
                });
            }
        });
        var outer = function (file, shortFile, stdout) {
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
                        console.error('\n', colors.yellow(' => Warning you have duplicate items in your exec args => '), '\n' + util.inspect(execArgz), '\n');
                    }
                    return true;
                });
                var n, hashbang = false;
                var extname = path.extname(shortFile);
                var cpOptions = {
                    cwd: sumanOpts.force_cwd_to_be_project_root ? projectRoot : path.dirname(file),
                    stdio: [
                        'ignore',
                        (isStdoutSilent ? 'ignore' : 'pipe'),
                        (isStderrSilent ? 'ignore' : 'pipe'),
                        'ipc'
                    ],
                    env: Object.assign({}, sumanEnv, {
                        SUMAN_CHILD_TEST_PATH: file,
                        SUMAN_CHILD_TEST_PATH_TARGET: file,
                        SUMAN_TRANSFORM_STDOUT: stdout
                    }),
                    detached: false
                };
                var sh = runnerUtils.findPathOfRunDotSh(file);
                if (sh) {
                    if (sumanOpts.coverage) {
                        _suman.logWarning(colors.magenta('coverage option was set to true, but we are running your tests via @run.sh.'));
                        _suman.logWarning(colors.magenta('so in this case, you will need to run your coverage call via @run.sh.'));
                    }
                    _suman.log('We have found the sh file => ', sh);
                    n = cp.spawn(sh, argz, cpOptions);
                }
                else {
                    if ('.js' === extname) {
                        if (suman_utils_1.default.isSumanDebug()) {
                            _suman.log('we are running js file');
                        }
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
                        console.log('file => ', file);
                        hashbang = true;
                        n = cp.spawn(file, argz, cpOptions);
                    }
                }
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
                    handleMessage(msg, n);
                });
                n.on('error', function (err) {
                    _suman.logError('error spawning child process => ', console.error(err.stack || err));
                    if (hashbang) {
                        console.error('\n');
                        console.error(' => The supposed test script file with the following path may not have a hashbang => ');
                        console.error(colors.magenta.bold(file));
                        console.error(' => A hashbang is necessary for non-.js files and when there is no accompanying @run.sh file.');
                        console.error(' => Without a hashbang, Suman (and your OS) will not know how to run the file.');
                        console.error(' => See sumanjs.org for more information.');
                    }
                });
                if (n.stdio) {
                    n.stdout.setEncoding('utf8');
                    n.stderr.setEncoding('utf8');
                    if (sumanOpts.inherit_stdio) {
                        n.stdout.pipe(prepend_transform_1.default(colors.bold(' => [suman child stdout] => '))).pipe(process.stdout).on('error', function (e) {
                            throw e;
                        });
                        n.stderr.pipe(prepend_transform_1.default(colors.red.bold(' => [suman child stderr] => '))).pipe(process.stderr).on('error', function (e) {
                            throw e;
                        });
                    }
                    if (sumanOpts.useTAPOutput) {
                        n.tapOutputIsComplete = false;
                        n.stdout.pipe(handleTap())
                            .on('error', function (e) {
                            throw e;
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
                    if (suman_utils_1.default.vgt(6)) {
                        _suman.logWarning('Stdio object not available for child process.');
                    }
                }
                n.once('exit', multiple_process_each_on_exit_1.default(n, runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit));
            };
            run.testPath = file;
            run.shortTestPath = shortFile;
            if (handleBlocking.runNext(run)) {
                if (suman_utils_1.default.vgt(3) || suman_utils_1.default.isSumanDebug()) {
                    _suman.log('File is running =>', file);
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
