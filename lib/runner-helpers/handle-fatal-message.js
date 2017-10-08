'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var EE = require("events");
var events = require('suman-events').events;
var su = require("suman-utils");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.handleFatalMessage = function ($msg, n, socket) {
    var msg = String(typeof $msg.error === 'string' ? $msg.error : util.inspect($msg)).replace(/\n/g, '\n').replace('\t', '');
    msg = msg.split('\n')
        .concat(su.repeatCharXTimes('_', 115))
        .map(function (item, index) {
        if (index === 0) {
            return item;
        }
        else {
            return su.padWithXSpaces(3) + item;
        }
    })
        .join('\n');
    var padding = su.padWithXSpaces(2);
    var message = [
        '\n',
        chalk.bgWhite.black.bold(' There was a fatal test suite error - an error was encountered in ' +
            'your test code that prevents Suman '),
        chalk.bgWhite.black.bold(' from continuing with a particular test suite within the following path: '),
        ' ',
        chalk.bgWhite.black.bold(' => ' + n.testPath + ' '),
        ' ',
        (function () {
            if (_suman.sumanOpts.verbosity > 3) {
                return chalk.grey('(note that despite this fatal error, other test processes will continue running, as would be expected, ' +
                    'use the ' + chalk.cyan('--bail') + ' option, if you wish otherwise.)');
            }
            return null;
        })(),
        chalk.magenta.bold(msg),
        '\n\n'
    ].filter(function (item) { return item; }).join('\n' + padding);
    resultBroadcaster.emit(String(events.FATAL_TEST_ERROR), message);
};
