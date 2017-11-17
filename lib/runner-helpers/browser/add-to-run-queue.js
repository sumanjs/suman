'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var EE = require("events");
var chalk = require("chalk");
var su = require("suman-utils");
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var prepend_transform_1 = require("prepend-transform");
var uuidV4 = require("uuid/v4");
var suman_constants_1 = require("../../../config/suman-constants");
var runChildPath = require.resolve(__dirname + '/../run-child.js');
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeAddToRunQueue = function (runnerObj, args, runQueue, projectRoot, cpHash, forkedCPs, onExitFn) {
    var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, maxProcs = _suman.maxProcs;
    var isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
    var isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
    var debugChildren = sumanOpts.debug_child || sumanOpts.inspect_child;
    var inheritRunStdio = debugChildren || sumanOpts.inherit_stdio ||
        sumanOpts.inherit_all_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes';
    var childId = 1;
    var cl = require('chrome-launcher');
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
    var port = _suman.socketServerPort;
    return function (file, shortFile, stdout, gd) {
        runQueue.push(function (cb) {
            if (runnerObj.bailed) {
                if (sumanOpts.verbosity > 4)
                    _suman.log.info('"--bailed" option was passed and was tripped, no more child processes will be forked.');
                return;
            }
            var argz = JSON.parse(JSON.stringify(args));
            var n, hashbang = false;
            var extname = path.extname(shortFile);
            var $childId = childId++;
            var childUuid = uuidV4();
            var inherit = _suman.$forceInheritStdio ? 'inherit' : '';
            if (inherit) {
                _suman.log.info('we are inheriting stdio of child, because of sumanception.');
            }
            var testData = JSON.stringify({
                childId: $childId
            });
            cl.launch({
                startingUrl: "http://localhost:" + port + "/suman_testing?data=" + testData,
                chromeFlags: ['--auto-open-devtools-for-tabs', '--debug-devtools']
            })
                .then(function (c) {
                var n = c.instance.chrome;
                _suman.log.info("Chrome debugging port running on " + c.port + ".\n");
                cpHash[String($childId)] = n;
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
                    _suman.log.error('Warning - Suman browser runner does not handle standard Node.js IPC messages.');
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
                    if (inheritRunStdio) {
                        var onError = function (e) {
                            _suman.log.error('\n', su.getCleanErrorString(e), '\n');
                        };
                        n.stdout.pipe(prepend_transform_1.default(chalk.cyan(' [suman child stdout] ')))
                            .once('error', onError).pipe(process.stdout);
                        n.stderr.pipe(prepend_transform_1.default(chalk.red.bold(' [suman child stderr] '), { omitWhitespace: true }))
                            .once('error', onError).pipe(process.stderr);
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
            });
        });
    };
};
