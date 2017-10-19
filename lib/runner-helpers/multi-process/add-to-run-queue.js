'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var path = require("path");
var cp = require("child_process");
var chalk = require("chalk");
var semver = require("semver");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var handle_tap_1 = require("../handle-tap");
var handle_tap_json_1 = require("../handle-tap-json");
var prepend_transform_1 = require("prepend-transform");
var uuidV4 = require("uuid/v4");
var runner_utils_1 = require("../runner-utils");
var suman_constants_1 = require("../../../config/suman-constants");
var runChildPath = require.resolve(__dirname + '/../run-child.js');
exports.makeAddToRunQueue = function (runnerObj, args, runQueue, projectRoot, cpHash, forkedCPs, onExitFn) {
    var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, maxProcs = _suman.maxProcs;
    var execFile = path.resolve(__dirname + '/../run-child.js');
    var istanbulExecPath = _suman.istanbulExecPath || 'istanbul';
    var isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
    var isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
    var debugChildren = sumanOpts.debug_child || sumanOpts.inspect_child;
    var inheritRunStdio = debugChildren || sumanOpts.inherit_stdio ||
        sumanOpts.inherit_all_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes';
    var childId = 1;
    var sumanEnv = Object.assign({}, process.env, {
        SUMAN_RUN_CHILD_STATIC_PATH: runChildPath,
        SUMAN_CONFIG: JSON.stringify(sumanConfig),
        SUMAN_OPTS: JSON.stringify(sumanOpts),
        SUMAN_RUNNER: 'yes',
        SUMAN_PROJECT_ROOT: projectRoot,
        SUMAN_RUN_ID: _suman.runId,
        SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
        NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes')
    });
    if (_suman.socketServerPort > 0) {
        sumanEnv['SUMAN_SOCKETIO_SERVER_PORT'] = _suman.socketServerPort;
    }
    return function (file, shortFile, stdout, gd) {
        runQueue.push(function () {
            if (runnerObj.bailed) {
                if (sumanOpts.verbosity > 4) {
                    _suman.log('"--bailed" option was passed and was tripped, ' +
                        'no more child processes will be forked.');
                }
                return;
            }
            var argz = JSON.parse(JSON.stringify(args));
            var execArgz = ['--expose-gc'];
            if (sumanOpts.debug_child) {
                execArgz.push('--debug=' + (5303 + runnerObj.processId++));
                execArgz.push('--debug-brk');
            }
            if (sumanOpts.inspect_child) {
                if (semver.gt(process.version, '7.8.0')) {
                    execArgz.push('--inspect-brk=' + (5303 + runnerObj.processId++));
                }
                else {
                    execArgz.push('--inspect=' + (5303 + runnerObj.processId++));
                    execArgz.push('--debug-brk');
                }
            }
            var execArgs;
            if (execArgs = sumanOpts.exec_arg) {
                execArgs.forEach(function (n) {
                    n && execArgz.push(String(n).trim());
                });
                String(execArgs).split(/S+/).forEach(function (n) {
                    n && execArgz.push('--' + String(n).trim());
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
            var childUuid = uuidV4();
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
                ],
                env: Object.assign({}, sumanEnv, {
                    SUMAN_CHILD_TEST_PATH: file,
                    SUMAN_CHILD_TEST_PATH_TARGET: file,
                    SUMAN_TRANSFORM_STDOUT: stdout,
                    SUMAN_CHILD_ID: String($childId),
                    SUMAN_CHILD_UUID: String($childId)
                })
            };
            var sh = runner_utils_1.findPathOfRunDotSh(file);
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
                    _suman.log("perl bash python or ruby file? '" + chalk.magenta(file) + "'");
                    hashbang = true;
                    n = cp.spawn(file, argz, cpOptions);
                }
            }
            cpHash[$childId] = n;
            if (!_suman.weAreDebugging) {
                n.to = setTimeout(function () {
                    _suman.logError("Suman killed a child process because it timed out: '" + (n.fileName || n.filename) + "'.");
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
                _suman.logError('Suman runner does not handle standard Node.js IPC messages.');
            });
            n.on('error', function (err) {
                _suman.logError('error spawning child process => ', err.stack || err);
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
                if (false && (sumanOpts.log_stdio_to_files || sumanOpts.log_stdout_to_files || sumanOpts.log_stderr_to_files)) {
                    var onError = function (e) {
                        _suman.logError('\n', su.getCleanErrorString(e), '\n');
                    };
                    var temp = su.removePath(file, _suman.projectRoot);
                    var onlyFile = String(temp).replace(/\//g, '.');
                    var logfile = path.resolve(f + '/' + onlyFile + '.log');
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
                        _suman.logError('\n', su.getCleanErrorString(e), '\n');
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
                        _suman.logError('error parsing TAP output =>', su.getCleanErrorString(e));
                    })
                        .once('finish', function () {
                        n.tapOutputIsComplete = true;
                        process.nextTick(function () {
                            n.emit('tap-output-is-complete', true);
                        });
                    });
                    n.stdout.pipe(handle_tap_json_1.getTapJSONParser())
                        .on('error', function (e) {
                        _suman.logError('error parsing TAP JSON output =>', su.getCleanErrorString(e));
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
                    _suman.logWarning('Stdio object not available for child process.');
                }
            }
            _suman.log(chalk.black('File has just started running =>'), chalk.grey.bold("'" + file + "'."));
            n.dateStartedMillis = gd.startDate = Date.now();
            n.once('exit', onExitFn(n, gd));
        });
    };
};