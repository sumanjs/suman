'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var util = require("util");
var assert = require("assert");
var chalk = require("chalk");
var dashdash = require("dashdash");
var debug = require('suman-debug')('child');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
require('../helpers/add-suman-global-properties');
var constants = require('../../config/suman-constants').constants;
var fatalRequestReply = require('../helpers/general').fatalRequestReply;
if (process.env.NPM_COLORS === 'no') {
    process.argv.push('--no-color');
    console.log(' => Suman child process setting itself to be color-free (--no-colors)');
}
var sumanOpts = _suman.sumanOpts = (_suman.sumanOpts || JSON.parse(process.env.SUMAN_OPTS));
var options = require('../parse-cmd-line-opts/suman-options');
var childArgs = String(sumanOpts.user_args || '').split(/ +/).filter(function (i) { return i; });
if (childArgs.length) {
    childArgs.unshift('foo');
    childArgs.unshift('baz');
    var opts = void 0, parser = dashdash.createParser({ options: options });
    try {
        opts = parser.parse(childArgs);
    }
    catch (err) {
        console.error(chalk.red(' => Suman command line options error: %s'), err.message);
        console.error(' => Try "suman --help" or visit sumanjs.org');
        process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
    }
    sumanOpts = _suman.sumanOpts = Object.assign(sumanOpts, opts);
}
var usingRunner = _suman.usingRunner = true;
var projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT;
process.send = process.send || function (data) {
    console.error(chalk.magenta('Suman implementation warning => '));
    console.error('process.send() was not originally defined in this process.');
    console.error('(Perhaps we are using Istanbul?), we are logging the first argument to process.send() here => ');
    console.error(chalk.red(typeof data === 'string' ? data : util.inspect(data)));
};
process.on('uncaughtException', function (err) {
    debugger;
    if (_suman.afterAlwaysEngaged) {
        return;
    }
    if (!err) {
        err = new Error('falsy value passed to uncaught exception handler.');
    }
    if (typeof err !== 'object') {
        err = {
            message: typeof err === 'string' ? err : util.inspect(err),
            stack: typeof err === 'string' ? err : util.inspect(err)
        };
    }
    setTimeout(function () {
        if (_suman.afterAlwaysEngaged) {
            return;
        }
        if (!err._alreadyHandledBySuman) {
            err._alreadyHandledBySuman = true;
            console.error(' => Suman => Uncaught exception in your test =>', '\n', (err.stack || err) + '\n\n');
            fatalRequestReply({
                type: constants.runner_message_type.FATAL,
                data: {
                    msg: ' => Suman => fatal error in suite with path="' + filePath + '"' +
                        '\n (note: You will need to transpile your test files if you wish to use "ES-next" features)',
                    error: err.stack || err
                }
            }, function () {
                process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
            });
        }
    }, 450);
});
var filePath = process.env.SUMAN_CHILD_TEST_PATH;
var sumanConfig;
if (process.env.SUMAN_CONFIG) {
    assert(typeof process.env.SUMAN_CONFIG === 'string', 'process.env.SUMAN_CONFIG is not a string.');
    sumanConfig = _suman.sumanConfig = JSON.parse(process.env.SUMAN_CONFIG);
}
else {
    sumanConfig = _suman.sumanConfig = require(path.resolve(projectRoot + '/suman.conf.js'));
}
var sumanHelperDirRoot = _suman.sumanHelperDirRoot = process.env['SUMAN_HELPERS_DIR_ROOT'];
assert(sumanHelperDirRoot, ' => sumanHelperDirRoot should be defined by process.env.SUMAN_HELPERS_DIR_ROOT, but is null/undefined');
require('../helpers/log-stdio-of-child').run(filePath);
var useBabelRegister = _suman.useBabelRegister = sumanOpts.$useBabelRegister;
if (useBabelRegister) {
    console.error(chalk.bgRed.white(' => We are using babel-register.'));
    require('babel-register')({
        ignore: /node_modules/
    });
}
var singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
try {
    require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));
}
catch (err) {
    _suman.log.error(chalk.yellow.bold('Suman usage warning => Could not load your suman.globals.js file.'));
    _suman.log.error(su.getCleanErrorString(err));
}
if (singleProc) {
    require('../handle-single-proc')(JSON.parse(process.env.SUMAN_SINGLE_PROCESS_FILES));
}
else {
    require(filePath);
}
