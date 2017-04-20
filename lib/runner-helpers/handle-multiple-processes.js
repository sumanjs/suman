'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var path = require('path');
var util = require('util');
var merge = require('lodash.merge');
var shuffle = require('lodash.shuffle');
var events = require('suman-events');
var su = require('suman-utils');
var async = require('async');
var noFilesFoundError = require('../helpers/no-files-found-error');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var runnerUtils = require('./runner-utils');
var handleTap = require('./handle-tap');
var constants = require('../../config/suman-constants');
var debug = require('suman-debug')('s:runner');
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
function default_1(runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit) {
    return function runSingleOrMultipleDirs(runObj) {
        var projectRoot = _suman.projectRoot;
        var maxProcs = _suman.maxProcs;
        if (_suman.sumanOpts.useTAPOutput) {
            if (_suman.sumanOpts.verbosity > 7) {
                console.log(colors.gray.bold(' => Suman runner is expecting TAP output from Node.js child processes ' +
                    'and will not be listening for IPC messages.'));
            }
        }
        var handleBlocking = runnerObj.handleBlocking;
        var args = _suman.userArgs;
        if (_suman.usingLiveSumanServer) {
            args.push('--live_suman_server');
        }
        var files = runObj.files;
        var filesThatDidNotMatch = runObj.filesThatDidNotMatch;
        filesThatDidNotMatch.forEach(function (val) {
            console.log('\n', colors.bgBlack.yellow(' => Suman message =>  A file in a relevant directory ' +
                'did not match your regular expressions => '), '\n', util.inspect(val));
        });
        resultBroadcaster.emit(String(events.RUNNER_STARTED), files.length);
        if (_suman.sumanOpts.rand) {
            files = shuffle(files);
        }
        handleBlocking.determineInitialStarters(files);
        runnerObj.startTime = Date.now();
        var fileObjArray = su.removeSharedRootPath(files);
        var sumanEnv = Object.assign({}, process.env, {
            SUMAN_CONFIG: JSON.stringify(_suman.sumanConfig),
            SUMAN_OPTS: JSON.stringify(_suman.sumanOpts),
            SUMAN_RUNNER: 'yes',
            SUMAN_RUN_ID: _suman.runId,
            SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
            NPM_COLORS: process.env.NPM_COLORS || (_suman.sumanOpts.no_color ? 'no' : 'yes')
        });
        var execFile = path.resolve(__dirname + '/run-child.js');
        var istanbulExecPath = _suman.istanbulExecPath;
        var isStdoutSilent = _suman.sumanOpts.stdout_silent || _suman.sumanOpts.silent;
        var isStderrSilent = _suman.sumanOpts.silent;
        fileObjArray.forEach(function (fileShortAndFull, index) {
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
            var argz = JSON.parse(JSON.stringify(args));
            var run = function _run() {
                if (runnerObj.bailed) {
                    if (_suman.sumanOpts.verbosity > 4) {
                        console.log(' => Suman => "--bailed" option was passed and was tripped, ' +
                            'no more child processes will be forked.');
                    }
                    return;
                }
                var execArgz = ['--expose-gc', '--harmony'];
                if (_suman.weAreDebugging) {
                    if (!_suman.sumanOpts.ignore_break) {
                        execArgz.push('--debug-brk');
                    }
                    execArgz.push('--debug=' + (5303 + runnerObj.processId++));
                }
                var execArgs;
                if (execArgs = _suman.sumanOpts.exec_arg) {
                    execArgs.forEach(function (n) {
                        if (n) {
                            execArgz.push(String(n).trim());
                        }
                    });
                }
                if (execArgs = _suman.sumanOpts.exec_args) {
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
                var dir = path.dirname(path.dirname(file));
                var filename = path.basename(file);
                var $file = path.resolve(dir + '/target/' + filename);
                var ext = merge({
                    env: {
                        SUMAN_CHILD_TEST_PATH: file,
                        SUMAN_CHILD_TEST_PATH_TARGET: $file
                    }
                }, {
                    cwd: _suman.sumanOpts.force_cwd_to_be_project_root ? projectRoot : path.dirname(file),
                    stdio: [
                        'ignore',
                        (isStdoutSilent ? 'ignore' : 'pipe'),
                        (isStderrSilent ? 'ignore' : 'pipe'),
                        'ipc'
                    ],
                    env: sumanEnv,
                    detached: false
                });
                var n, hashbang = false;
                var tr = runnerUtils.findPathOfTransformDotSh(file);
                if (false && tr) {
                    cp.spawnSync(tr, [], {
                        env: Object.assign({}, process.env, {
                            SUMAN_CHILD_TEST_PATH: file
                        })
                    });
                    console.log('file => ', $file);
                }
                var extname = path.extname(shortFile);
                if (_suman.sumanOpts.coverage && '.js' === extname) {
                    var coverageDir = path.resolve(_suman.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
                    n = cp.spawn(istanbulExecPath, ['cover', execFile, '--dir', coverageDir, '--'].concat(args), ext);
                }
                else if ('.js' === extname) {
                    argz.unshift(execFile);
                    var argzz = $execArgz.concat(argz);
                    n = cp.spawn('node', argzz, ext);
                }
                else {
                    if (_suman.sumanOpts.coverage) {
                        console.log(colors.magenta(' => Suman warning => You wish for coverage with Istanbul/NYC,\nbut these tools' +
                            'cannot run coverage against files that cannot be run with node.js.'));
                    }
                    var sh = runnerUtils.findPathOfRunDotSh(file);
                    if (false && sh) {
                        console.log(' => We have found the sh file => ', sh);
                        n = cp.spawn(sh, argz, ext);
                    }
                    else {
                        hashbang = true;
                        n = cp.spawn(file, argz, ext);
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
                    console.error('\n', err.stack || err, '\n');
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
                    if (_suman.sumanOpts.inherit_stdio) {
                        n.stdout.pipe(process.stdout);
                        n.stderr.pipe(process.stderr);
                    }
                    if (_suman.sumanOpts.useTAPOutput) {
                        n.tapOutputIsComplete = false;
                        n.stdout.pipe(handleTap())
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
                    if (su.vgt(8)) {
                        console.log(' => Suman(lv.8) => Stdio object not available for child process.');
                    }
                }
                n.once('exit', function (code, signal) {
                    resultBroadcaster.emit(String(events.TEST_FILE_CHILD_PROCESS_EXITED), {
                        testPath: n.testPath,
                        exitCode: code
                    });
                    if (su.isSumanDebug() || su.vgt(5)) {
                        console.log('\n', colors.black.bgYellow(' => process given by => ' +
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
                            console.log(colors.magenta(' => Suman warning message => ' +
                                'We have ' + colors.red.bold('bailed') + ' the test runner because a child process experienced an error ' +
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
                            if (_suman.sumanOpts.verbosity > 4) {
                                console.log('\n\n');
                                console.log(colors.blue('\t=> Suman message => ') +
                                    colors.blue.bold.underline(' All scheduled child processes have exited.'));
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
                                        console.log(colors.blue.bold(' => Suman is running the Istanbul collated report.'));
                                        console.log(colors.blue.bold(' => To disable automatic report generation, use "--no-coverage-report".'));
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
                });
            };
            run.testPath = file;
            run.shortTestPath = shortFile;
            if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
                runnerObj.queuedCPs.push(run);
                if (su.isSumanDebug()) {
                    console.log(' => File is blocked by Suman runner =>', file);
                }
            }
            else {
                run();
                if (su.isSumanDebug()) {
                    console.log(' => File is running =>', file);
                }
            }
        });
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
            resultBroadcaster.emit(String(events.RUNNER_INITIAL_SET), forkedCPs, processes, suites);
            var addendum = maxProcs < totalCount ? ' with no more than ' + maxProcs + ' running at a time.' : '';
            resultBroadcaster.emit(String(events.RUNNER_OVERALL_SET), totalCount, processes, suites, addendum);
        }
    };
}
exports.default = default_1;
;
