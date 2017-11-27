'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var fs = require("fs");
var EE = require("events");
var chalk = require("chalk");
var su = require("suman-utils");
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var handle_tap_1 = require("../handle-tap");
var prepend_transform_1 = require("prepend-transform");
var uuidV4 = require("uuid/v4");
var runner_utils_1 = require("../runner-utils");
var suman_constants_1 = require("../../../config/suman-constants");
var handle_different_executables_1 = require("./handle-different-executables");
var runChildPath = require.resolve(__dirname + '/../run-child.js');
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeAddToRunQueue = function (runnerObj, args, runQueue, projectRoot, cpHash, forkedCPs, onExitFn) {
    var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, maxProcs = _suman.maxProcs;
    var isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
    var isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
    var debugChildren = sumanOpts.debug_child || sumanOpts.inspect_child;
    var inheritRunStdio = debugChildren || sumanOpts.inherit_stdio ||
        sumanOpts.inherit_all_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes';
    var _a = handle_different_executables_1.makeHandleDifferentExecutables(projectRoot, sumanOpts, runnerObj), handleRunDotShFile = _a.handleRunDotShFile, handleRegularFile = _a.handleRegularFile;
    var childId = 1;
    var sumanEnv = Object.assign({}, process.env, {
        SUMAN_RUN_CHILD_STATIC_PATH: runChildPath,
        SUMAN_CONFIG: JSON.stringify(sumanConfig),
        SUMAN_OPTS: JSON.stringify(sumanOpts),
        SUMAN_RUNNER: 'yes',
        SUMAN_PROJECT_ROOT: projectRoot,
        SUMAN_RUN_ID: _suman.runId,
        SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
        NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes'),
        SUMAN_SOCKETIO_SERVER_PORT: _suman.socketServerPort > 0 ? _suman.socketServerPort : undefined
    });
    return function (file, shortFile, stdout, gd) {
        runQueue.push(function (cb) {
            if (runnerObj.bailed) {
                if (sumanOpts.verbosity > 4) {
                    _suman.log.info('"--bailed" option was passed and was tripped, ' +
                        'no more child processes will be forked.');
                }
                return;
            }
            var argz = JSON.parse(JSON.stringify(args));
            var hashbang = false;
            var $childId = childId++;
            var childUuid = uuidV4();
            var inherit = _suman.$forceInheritStdio ? 'inherit' : '';
            if (inherit) {
                _suman.log.info('we are inheriting stdio of child, because of sumanception.');
            }
            var cpOptions = {
                detached: false,
                cwd: projectRoot,
                stdio: [
                    'ignore',
                    inherit || (isStdoutSilent ? 'ignore' : 'pipe'),
                    inherit || (isStderrSilent ? 'ignore' : 'pipe'),
                ],
                env: Object.assign({}, sumanEnv, {
                    SUMAN_CHILD_TEST_PATH: file,
                    SUMAN_CHILD_TEST_PATH_TARGET: file,
                    SUMAN_TRANSFORM_STDOUT: stdout,
                    SUMAN_CHILD_ID: String($childId),
                    SUMAN_CHILD_UUID: String(childUuid)
                })
            };
            var onChildProcessStarted = function (err, n) {
                if (err) {
                    _suman.log.error();
                    _suman.log.error(chalk.bold('Error launching child process:'));
                    _suman.log.error(err.stack || err.message || err);
                }
                if (!n) {
                    throw new Error('child process could not start at all.');
                }
                cpHash[$childId] = n;
                if (!_suman.weAreDebugging) {
                    n.to = setTimeout(function () {
                        _suman.log.error("Suman killed a child process because it timed out: '" + (n.fileName || n.filename) + "'.");
                        n.kill('SIGINT');
                        setTimeout(function () {
                            n.kill('SIGKILL');
                        }, 8000);
                    }, suman_constants_1.constants.DEFAULT_CHILD_PROCESS_TIMEOUT);
                }
                n.testPath = file;
                n.shortTestPath = shortFile;
                forkedCPs.push(n);
                n.on('message', function (msg) {
                    _suman.log.error('Warning - Suman runner does not handle standard Node.js IPC messages.');
                });
                n.on('error', function (err) {
                    _suman.log.error('error spawning child process => ', err.stack || err);
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
                        _suman.log.error('n.stdio is defined even though we are in sumanception territory.');
                    }
                    n.stdout.setEncoding('utf8');
                    n.stderr.setEncoding('utf8');
                    if (false && (sumanOpts.log_stdio_to_files || sumanOpts.log_stdout_to_files || sumanOpts.log_stderr_to_files)) {
                        var onError = function (e) {
                            _suman.log.error('\n', su.getCleanErrorString(e), '\n');
                        };
                        var temp = su.removePath(file, _suman.projectRoot);
                        var onlyFile = String(temp).replace(/\//g, '.');
                        var logfile = path.resolve(file + '/' + onlyFile + '.log');
                        var fileStrm = fs.createWriteStream(logfile);
                        console.log('logFile => ', logfile);
                        if (sumanOpts.log_stdio_to_files || sumanOpts.log_stderr_to_files) {
                            n.stderr.pipe(fileStrm).once('error', onError);
                        }
                        if (sumanOpts.log_stdio_to_files || sumanOpts.log_stdout_to_files) {
                            n.stdout.pipe(fileStrm).once('error', onError);
                        }
                    }
                    if (inheritRunStdio) {
                        var onError = function (e) {
                            _suman.log.error('\n', su.getCleanErrorString(e), '\n');
                        };
                        n.stdout.pipe(prepend_transform_1.default(chalk.cyan(' [suman child stdout] ')))
                            .once('error', onError).pipe(process.stdout);
                        n.stderr.pipe(prepend_transform_1.default(chalk.red.bold(' [suman child stderr] '), { omitWhitespace: true }))
                            .once('error', onError).pipe(process.stderr);
                    }
                    if (true || sumanOpts.$useTAPOutput) {
                        n.tapOutputIsComplete = false;
                        n.stdout.pipe(handle_tap_1.getTapParser())
                            .on('error', function (e) {
                            _suman.log.error('error parsing TAP output =>', su.getCleanErrorString(e));
                        })
                            .once('finish', function () {
                            n.tapOutputIsComplete = true;
                            process.nextTick(function () {
                                n.emit('tap-output-is-complete', true);
                            });
                        });
                    }
                    if (true || sumanOpts.$useTAPJSONOutput) {
                        n.tapOutputIsComplete = false;
                        n.stdout.pipe(handle_tap_1.getTapJSONParser())
                            .on('error', function (e) {
                            _suman.log.error('error parsing TAP-JSON output =>', su.getCleanErrorString(e));
                        });
                    }
                    n.stdio[2].setEncoding('utf-8');
                    n.stdio[2].on('data', function (data) {
                        var d = String(data).split('\n').filter(function (line) {
                            return String(line).length;
                        })
                            .map(function (line) {
                            return '[' + n.shortTestPath + '] ' + line;
                        })
                            .join('\n');
                        _suman.sumanStderrStream.write('\n' + d);
                        if (_suman.weAreDebugging) {
                            console.log('pid => ', n.pid, 'stderr => ', d);
                        }
                    });
                }
                else {
                    if (su.vgt(2)) {
                        _suman.log.warning('stdio object not available for child process.');
                    }
                }
                rb.emit(String(suman_events_1.events.RUNNER_SAYS_FILE_HAS_JUST_STARTED_RUNNING), file);
                n.dateStartedMillis = gd.startDate = Date.now();
                n.once('exit', onExitFn(n, gd, cb));
            };
            var sh = !sumanOpts.ignore_run_config && runner_utils_1.findPathOfRunDotSh(file);
            if (sh) {
                handleRunDotShFile(sh, argz, cpOptions, onChildProcessStarted);
            }
            else {
                handleRegularFile(file, shortFile, argz, cpOptions, onChildProcessStarted);
            }
        });
    };
};
