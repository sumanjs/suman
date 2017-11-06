'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var async = require("async");
var chalk = require("chalk");
var flattenDeep = require('lodash.flattendeep');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var runAfterAlways = require('./helpers/run-after-always').runAfterAlways;
var constants = require('../config/suman-constants').constants;
var singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var general_1 = require("./helpers/general");
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var debug = require('suman-debug')('s:graceful-exit');
var testErrors = _suman.testErrors = _suman.testErrors || [];
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
exports.makeGracefulExit = function (suman) {
    return function runGracefulExitOrNot($errs, cb) {
        var fst = _suman.sumanOpts.full_stack_traces;
        if (cb && typeof cb !== 'function') {
            throw new Error('Suman implementation error - callback was not passed to gracefulExit, please report.');
        }
        var highestExitCode = 0;
        var exitTestSuite = false;
        var errs = flattenDeep([$errs]).filter(function (e) { return e; });
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.log.error('"uncaughtException" event occurred => halting program.');
            if (errs.length) {
                errs.filter(function (e) { return e; }).forEach(function (e) {
                    _suman.log.error(chalk.red('Most likely unrelated error => Graceful exit error => \n') + su.getCleanErrorString(e));
                });
            }
            _suman.log.error('reached graceful exit, but "sumanUncaughtExceptionTriggered" was already true.');
            return cb && process.nextTick(cb);
        }
        var big = errs.filter(function (err) {
            if (err && err.isFromTest && !_suman.sumanOpts.bail) {
                return undefined;
            }
            else if (err && err.sumanFatal === false) {
                return undefined;
            }
            else if (err) {
                return true;
            }
            else {
                return undefined;
            }
        })
            .map(function (err) {
            var sumanFatal = err.sumanFatal;
            var exitCode = err.sumanExitCode;
            if (exitCode) {
                console.error('\n');
                _suman.log.error('positive exit code with value', exitCode);
            }
            if (exitCode > highestExitCode) {
                highestExitCode = exitCode;
            }
            var stack = su.getCleanErrStr(err).split('\n').filter(function (item, index) {
                if (fst) {
                    return true;
                }
                if (index < 2) {
                    return true;
                }
                if (String(item).match(/\//) &&
                    !String(item).match(/\/node_modules\//) &&
                    !String(item).match(/next_tick.js/)) {
                    return true;
                }
            });
            stack[0] = chalk.bold(stack[0]);
            return stack.join('\n').concat('\n');
        })
            .map(function (err) {
            exitTestSuite = true;
            sumanRuntimeErrors.push(err);
            var isBail = _suman.sumanOpts.bail ? '(note that the "--bail" option set to true)\n' : '';
            var str = '\n⚑ ' + chalk.bgRed.white.bold(' Suman fatal error ' + isBail +
                ' => making a graceful exit => ') + '\n' + chalk.red(String(err)) + '\n\n';
            var padded = str.split('\n').map(function (s) {
                return su.padWithXSpaces(3) + s;
            });
            var s = padded.join('\n');
            console.log('\n');
            _suman.log.error(s);
            return s;
        });
        if (singleProc && exitTestSuite) {
            _suman.log.error('Suman single process and runtime uncaught exception or error in hook experienced.');
            suiteResultEmitter.emit('suman-test-file-complete');
        }
        else if (exitTestSuite) {
            if (!suman.sumanCompleted) {
                async.parallel([
                    function (cb) {
                        var joined = big.join('\n');
                        general_1.fatalRequestReply({
                            type: constants.runner_message_type.FATAL,
                            data: {
                                msg: joined,
                                error: joined
                            }
                        }, cb);
                    },
                    function (cb) {
                        runAfterAlways(suman, cb);
                    }
                ], function () {
                    suman.logFinished(highestExitCode || 1, null, function (err, val) {
                        err && _suman.log.error(su.getCleanErrorString(err));
                        process.exit(highestExitCode || 1);
                    });
                });
            }
        }
        else {
            if (cb) {
                process.nextTick(cb);
            }
            else {
                _suman.log.error('Suman implementation warning: no callback passed to graceful exit routine.');
            }
        }
    };
};
