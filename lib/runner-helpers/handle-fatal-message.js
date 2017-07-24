'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var events = require('suman-events').events;
var su = require("suman-utils");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
module.exports = function handleFatalMessage(msg, n) {
    var foo = String(typeof msg.error === 'string' ?
        msg.error :
        util.inspect(msg)).replace(/\n/g, '\n').replace('\t', '');
    foo = foo.split('\n').map(function (item, index) {
        if (index === 0) {
            return item;
        }
        else {
            return su.padWithXSpaces(8) + item;
        }
    }).join('\n');
    var message = [
        '\n',
        chalk.bgMagenta.white.bold(' => Suman runner => there was a fatal test suite error - an error was encountered in ' +
            'your test code that prevents Suman '),
        chalk.bgMagenta.white.bold(' from continuing with a particular test suite within the following path: '),
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
        ' ',
        chalk.magenta.bold(foo),
        '\n\n'
    ].filter(function (item) { return item; }).join('\n\t');
    resultBroadcaster.emit(String(events.FATAL_TEST_ERROR), message);
};
