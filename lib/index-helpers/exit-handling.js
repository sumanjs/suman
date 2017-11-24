'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var Domain = require("domain");
var async = require("async");
var chalk = require("chalk");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var general_1 = require("../helpers/general");
var suman_constants_1 = require("../../config/suman-constants");
var handle_suman_once_post_1 = require("../helpers/handle-suman-once-post");
var run_after_always_1 = require("../helpers/run-after-always");
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var weAreDebugging = su.weAreDebugging;
var shutdownSuman = function (msg) {
    async.parallel([
        function (cb) {
            async.series([
                function (cb) {
                    if (run_after_always_1.runAfterAlways && _suman.whichSuman) {
                        run_after_always_1.runAfterAlways(_suman.whichSuman, cb);
                    }
                    else {
                        process.nextTick(cb);
                    }
                },
                function (cb) {
                    if (handle_suman_once_post_1.oncePostFn) {
                        handle_suman_once_post_1.oncePostFn(cb);
                    }
                    else {
                        _suman.log.error('Suman internal warning, "oncePostFn" routine not yet available.');
                        process.nextTick(cb);
                    }
                },
            ], cb);
        },
        function (cb) {
            general_1.fatalRequestReply({
                type: suman_constants_1.constants.runner_message_type.FATAL,
                data: {
                    error: msg,
                    msg: msg
                }
            }, cb);
        }
    ], function (err, resultz) {
        var results = resultz[0];
        err && console.error('Error in exit handler => \n', err.stack || err);
        if (Array.isArray(results)) {
            results.filter(function (r) { return r; }).forEach(function (r) {
                console.error(r.stack || r);
            });
            process.nextTick(function () {
                process.exit(88);
            });
        }
        else {
            process.nextTick(function () {
                process.exit(89);
            });
        }
    });
};
var sigintCount = 0;
process.on('SIGINT', function () {
    debugger;
    sigintCount++;
    console.log('\n');
    _suman.log.error(chalk.red('SIGINT signal caught by suman process.'));
    console.log('\n');
    if (sigintCount === 2) {
        process.exit(1);
    }
    else if (sigintCount === 1) {
        shutdownSuman('SIGINT received');
    }
});
var sigtermCount = 0;
process.on('SIGTERM', function () {
    debugger;
    sigtermCount++;
    console.log('\n');
    _suman.log.error(chalk.red('SIGTERM signal caught by suman process.'));
    console.log('\n');
    if (sigtermCount === 2) {
        process.exit(1);
    }
    else if (sigtermCount === 1) {
        shutdownSuman('SIGTERM received');
    }
});
process.on('warning', function (w) {
    if (weAreDebugging) {
        console.error(w.stack || w);
    }
    else if (!(/deprecated/i.test(String(w)))) {
        console.error(w.stack || w);
    }
});
process.removeAllListeners('uncaughtException');
process.on('uncaughtException', function (err) {
    debugger;
    var sumanOpts = _suman.sumanOpts;
    if (!err) {
        err = new Error('falsy value passed to uncaught exception handler.');
    }
    if (typeof err !== 'object') {
        err = {
            name: 'uncaughtException',
            message: typeof err === 'string' ? err : util.inspect(err),
            stack: typeof err === 'string' ? err : util.inspect(err)
        };
    }
    if (err._alreadyHandledBySuman) {
        console.error(' => Error already handled => \n', (err.stack || err));
        return;
    }
    err._alreadyHandledBySuman = true;
    sumanRuntimeErrors.push(err);
    var avoidShutdown = false;
    var d;
    if (err && (d = err.domain)) {
        if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
            typeof err === 'object' && (err._alreadyHandledBySuman = true);
            d.emit('error', err);
            return;
        }
    }
    if (d = process.domain) {
        if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
            typeof err === 'object' && (err._alreadyHandledBySuman = true);
            d.emit('error', err);
            return;
        }
    }
    if (sumanOpts && sumanOpts.series) {
        if (d = _suman.activeDomain) {
            d.emit('error', err);
            return;
        }
    }
    if (_suman.afterAlwaysEngaged) {
        return;
    }
    try {
        process.domain && process.domain.exit();
    }
    catch (err) {
    }
    process.nextTick(function () {
        var d;
        if (d = process.domain) {
            if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
                avoidShutdown = true;
                typeof err === 'object' && (err._alreadyHandledBySuman = true);
                d.emit('error', err);
                return;
            }
        }
        if (d = Domain._stack && Domain._stack.pop()) {
            if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
                avoidShutdown = true;
                typeof err === 'object' && (err._alreadyHandledBySuman = true);
                d.emit('error', err);
                return;
            }
        }
    });
    if (!sumanOpts || sumanOpts.ignoreUncaughtExceptions !== false) {
        _suman.sumanUncaughtExceptionTriggered = err;
        setTimeout(function () {
            debugger;
            if (avoidShutdown) {
                _suman.log.warning('suman avoided a shutdown, by catching the domain.');
                return;
            }
            var msg = err.stack || err;
            if (typeof msg !== 'string') {
                msg = util.inspect(msg);
            }
            console.error('\n');
            _suman.log.error(chalk.magenta.bold(' => Suman uncaught exception => \n', chalk.magenta(msg)), '\n');
            _suman.log.error('Given the event of an uncaught exception, Suman will now run "suman.once.post.js" shutdown hooks...');
            console.error('\n');
            _suman.log.error(' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
                'the "--ignore-uncaught-exceptions" option.)');
            shutdownSuman(msg);
        }, 200);
    }
});
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', function ($reason, p) {
    debugger;
    var sumanOpts = _suman.sumanOpts;
    var reason = $reason ? ($reason.stack || $reason) : new Error('no reason passed to "unhandledRejection" handler.');
    if (p && p.domain) {
        if (p.domain.sumanTestCase || p.domain.sumanEachHook || p.domain.sumanAllHook) {
            typeof reason === 'object' && (reason._alreadyHandledBySuman = true);
            p.domain.emit('error', reason);
            return;
        }
    }
    if (process.domain) {
        if (process.domain.sumanTestCase || process.domain.sumanEachHook || process.domain.sumanAllHook) {
            typeof reason === 'object' && ($reason._alreadyHandledBySuman = true);
            process.domain.emit('error', reason);
            return;
        }
    }
    if (sumanOpts && sumanOpts.series) {
        if (_suman.activeDomain) {
            _suman.activeDomain.emit('error', reason);
            return;
        }
    }
    console.error('\n');
    _suman.log.error(chalk.magenta.bold('Unhandled Rejection at Promise:'), chalk.magenta(util.inspect(p)));
    console.error('\n');
    _suman.log.error(chalk.magenta.bold('Rejection reason'), chalk.magenta(reason));
    console.error('\n');
    _suman.sumanUncaughtExceptionTriggered = reason;
    if (_suman.afterAlwaysEngaged) {
        return;
    }
    if (!sumanOpts || sumanOpts.ignoreUncaughtExceptions !== false) {
        setTimeout(function () {
            shutdownSuman(reason);
        }, 200);
    }
});
