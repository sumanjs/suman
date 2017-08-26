'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var async = require("async");
var chalk = require("chalk");
var flattenDeep = require('lodash.flattendeep');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var runAfterAlways = require('./helpers/run-after-always').runAfterAlways;
var constants = require('../config/suman-constants').constants;
var singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var fatalRequestReply = require('./helpers/fatal-request-reply').fatalRequestReply;
var debug = require('suman-debug')('s:graceful-exit');
var testErrors = _suman.testErrors = _suman.testErrors || [];
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
exports.makeGracefulExit = function (suman) {
    return function runGracefulExitOrNot(errs, cb) {
        var fst = _suman.sumanOpts.full_stack_traces;
        if (cb && typeof cb !== 'function') {
            throw new Error('Suman implementation error - callback was not passed to gracefulExit, please report.');
        }
        var highestExitCode = 0;
        var exitTestSuite = false;
        errs = flattenDeep([errs]).filter(function (e) { return e; });
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.logError('"uncaughtException" event occurred => halting program.');
            if (errs.length) {
                errs.filter(function (e) { return e; }).forEach(function (e) {
                    console.error('Most likely unrelated error => Graceful exit error => ' + (e.stack || e));
                });
            }
            _suman.logError('reached graceful exit, but "sumanUncaughtExceptionTriggered" was already true.');
            return process.nextTick(cb);
        }
        var big = errs.filter(function (err) {
            if (err && err.isFromTest && !_suman.sumanOpts.bail) {
                return undefined;
            }
            else if (err && err.sumanFatal === false) {
                return undefined;
            }
            else if (err && err instanceof Error) {
                return err;
            }
            else if (err) {
                if (err.stack) {
                    return err;
                }
                else {
                    return new Error(util.inspect(err));
                }
            }
            else {
                return undefined;
            }
        })
            .map(function (err) {
            var sumanFatal = err.sumanFatal;
            var exitCode = err.sumanExitCode;
            if (exitCode) {
                _suman.logError('positive exit code with value', exitCode);
            }
            if (exitCode > highestExitCode) {
                highestExitCode = exitCode;
            }
            var stack = String(err.stack || err).split('\n');
            stack.filter(function (item, index) {
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
            })
                .map(function (item, index) {
                return item;
            });
            stack[0] = chalk.bold(stack[0]);
            return stack.join('\n').concat('\n');
        })
            .map(function (err) {
            exitTestSuite = true;
            sumanRuntimeErrors.push(err);
            debug(' => Graceful exit error message => ', err);
            var isBail = _suman.sumanOpts.bail ? '(--bail option set to true)' : '';
            var str = '\n\u2691 ' +
                chalk.bgRed.white.bold(' => Suman fatal error ' + isBail +
                    ' => making a graceful exit => ') + '\n' + chalk.red(err) + '\n\n';
            var s = str.split('\n').map(function (s) {
                return su.padWithXSpaces(3) + s;
            }).join('\n');
            console.log('\n');
            console.error(s);
            return s;
        });
        if (singleProc && exitTestSuite) {
            console.error(' => Suman single process and runtime uncaught exception or error in hook experienced.');
            suman._sumanEvents.emit('suman-test-file-complete');
        }
        else if (exitTestSuite) {
            if (!suman.sumanCompleted) {
                async.parallel([
                    function (cb) {
                        var joined = big.join('\n');
                        fatalRequestReply({
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
                    _suman.log('finished running graceful exit...');
                    suman.logFinished(highestExitCode || 1, null, function (err, val) {
                        if (err) {
                            _suman.logError(new Error(String(err.stack || err)));
                        }
                        process.exit(highestExitCode || 1);
                    });
                });
            }
        }
        else {
            process.nextTick(cb);
        }
    };
};
