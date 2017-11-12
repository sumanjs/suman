'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var path = require('path');
var EE = require('events');
var semver = require("semver");
var merge = require('lodash.merge');
var shuffle = require('lodash.shuffle');
var events = require('suman-events').events;
var su = require("suman-utils");
var prepend_transform_1 = require("prepend-transform");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var weAreDebugging = su.weAreDebugging;
var _a = require('./handle-tap'), getTapParser = _a.getTapParser, getTapJSONParser = _a.getTapJSONParser;
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
module.exports = function (runnerObj, handleMessageForSingleProcess, messages, beforeExitRunOncePost, makeExit) {
    return function runAllTestsInSingleProcess(runObj) {
        var SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
        var projectRoot = _suman.projectRoot, sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig;
        var startFile = path.resolve(__dirname + '/run-child.js');
        var args = [startFile];
        var files = runObj.files;
        if (sumanOpts.rand) {
            files = shuffle(files);
        }
        var $files = su.removeSharedRootPath(files);
        var SUMAN_SINGLE_PROCESS_FILES = JSON.stringify($files);
        var toPrint = $files.map(function (f) {
            return ' => ' + f[1];
        });
        toPrint.unshift('');
        toPrint.push('');
        toPrint.push('');
        toPrint.push('');
        _suman.log.info('Files running in single process =>\n', toPrint.join('\n\t'));
        runnerObj.startTime = Date.now();
        var sumanEnv = Object.assign({}, process.env, {
            SUMAN_CONFIG: JSON.stringify(sumanConfig),
            SUMAN_OPTS: JSON.stringify(sumanOpts),
            SUMAN_SINGLE_PROCESS_FILES: SUMAN_SINGLE_PROCESS_FILES,
            SUMAN_SINGLE_PROCESS: 'yes',
            SUMAN_RUNNER: 'yes',
            SUMAN_RUN_ID: _suman.runId,
            SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
            NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes')
        });
        if (sumanOpts.register) {
            args.push('--register');
        }
        var execArgz = ['--expose-gc', '--expose_debug_as=v8debug'];
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
        var isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
        var isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
        var ext = {
            cwd: projectRoot,
            stdio: [
                'ignore',
                (isStdoutSilent ? 'ignore' : 'pipe'),
                (isStderrSilent ? 'ignore' : 'pipe'),
                'ipc'
            ],
            execArgv: execArgz,
            env: sumanEnv,
            detached: false
        };
        var n = cp.spawn('node', args, ext);
        n.on('message', function (msg) {
            handleMessageForSingleProcess(msg, n);
        });
        n.on('error', function (err) {
            throw new Error(err.stack || err);
        });
        if (n.stdio) {
            n.stdout.setEncoding('utf8');
            n.stderr.setEncoding('utf8');
            if (sumanOpts.inherit_stdio || false) {
                n.stdout.pipe(prepend_transform_1.default(chalk.blue(' [suman child stdout] '))).pipe(process.stdout);
                n.stderr.pipe(prepend_transform_1.default(chalk.red.bold(' [suman child stderr] '), { omitWhitespace: true })).pipe(process.stderr);
            }
            if (true || sumanOpts.$useTAPOutput) {
                n.tapOutputIsComplete = false;
                n.stdout.pipe(getTapParser())
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
            if (su.vgt(6)) {
                _suman.log.warning('stdio object not available for child process.');
            }
        }
        n.once('exit', function (code, signal) {
            if (SUMAN_DEBUG) {
                console.log('\n');
                _suman.log.info(chalk.black.bgYellow('process given by => ' + n.shortTestPath + ' exited with code: ' + code + ' '));
                console.log('\n');
            }
            if (SUMAN_DEBUG) {
                _suman.timeOfMostRecentExit = Date.now();
            }
            n.removeAllListeners();
            runnerObj.doneCount++;
            messages.push({ code: code, signal: signal });
            runnerObj.listening = false;
            setImmediate(function () {
                beforeExitRunOncePost(function (err) {
                    if (err) {
                        throw err;
                    }
                    makeExit(messages, Date.now() - runnerObj.startTime);
                });
            });
        });
    };
};
