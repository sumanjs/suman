"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var async = require("async");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var fatalRequestReply = require('../helpers/fatal-request-reply').fatalRequestReply;
var suman_constants_1 = require("../../config/suman-constants");
var handle_suman_once_post_1 = require("../helpers/handle-suman-once-post");
var run_after_always_1 = require("../helpers/run-after-always");
var sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var weAreDebugging = require('../helpers/we-are-debugging');
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
                    if (handle_suman_once_post_1.default) {
                        handle_suman_once_post_1.default(cb);
                    }
                    else {
                        console.error(' => Suman internal warning, oncePostFn not yet defined.');
                        process.nextTick(cb);
                    }
                },
            ], cb);
        },
        function (cb) {
            fatalRequestReply({
                type: suman_constants_1.constants.runner_message_type.FATAL,
                data: {
                    error: msg,
                    msg: msg
                }
            }, cb);
        }
    ], function (err, resultz) {
        var results = resultz[0];
        if (err) {
            console.error('Error in exit handler => \n', err.stack || err);
        }
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
    sigintCount++;
    console.log('\n');
    _suman.logError(chalk.red('SIGINT signal caught by suman process.'));
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
    sigtermCount++;
    console.log('\n');
    _suman.logError(chalk.red('SIGTERM signal caught by suman process.'));
    console.log('\n');
    if (sigtermCount === 2) {
        process.exit(1);
    }
    else if (sigtermCount === 1) {
        shutdownSuman('SIGINT received');
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
process.on('uncaughtException', function (err) {
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
    if (_suman.afterAlwaysEngaged) {
        return;
    }
    setTimeout(function () {
        var msg = err.stack || err;
        if (typeof msg !== 'string') {
            msg = util.inspect(msg);
        }
        console.error('\n');
        console.error(chalk.magenta.bold(' => Suman uncaught exception => ', chalk.magenta(msg)));
        if (!_suman.sumanOpts || _suman.sumanOpts.ignoreUncaughtExceptions !== false) {
            _suman.sumanUncaughtExceptionTriggered = err;
            console.error('\n\n', ' => Given uncaught exception,' +
                ' Suman will now run suman.once.post.js shutdown hooks...');
            console.error('\n\n', ' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
                'the "--ignore-uncaught-exceptions" option.)');
            shutdownSuman(msg);
        }
    }, 400);
});
process.on('unhandledRejection', function (reason, p) {
    reason = (reason.stack || reason);
    console.error('\n');
    console.error('Unhandled Rejection at: Promise => ', p);
    console.error('\n');
    console.error('=> Rejection reason => ', reason);
    if (_suman.sumanOpts || _suman.sumanOpts.ignoreUncaughtExceptions !== false) {
        _suman.sumanUncaughtExceptionTriggered = reason;
        fatalRequestReply({
            type: suman_constants_1.constants.runner_message_type.FATAL,
            data: {
                error: reason,
                msg: reason
            }
        }, function () {
            process.exit(53);
        });
    }
});
