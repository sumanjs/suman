'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
const {events} = require('suman-events');
import su = require('suman-utils');
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

///////////////////////////////////

module.exports = function handleFatalMessage (msg, n) {

  let foo = String(typeof msg.error === 'string' ?
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

  const message = [
    '\n',
    chalk.bgMagenta.white.bold(' => Suman runner => there was a fatal test suite error - an error was encountered in ' +
      'your test code that prevents Suman '),
    chalk.bgMagenta.white.bold(' from continuing with a particular test suite within the following path: '),
    ' ',
    chalk.bgWhite.black.bold(' => ' + n.testPath + ' '),
    ' ', //chalk.bgBlack.white(' '),
    (function () {
      if (_suman.sumanOpts.verbosity > 3) {
        return chalk.grey('(note that despite this fatal error, other test processes will continue running, as would be expected, ' +
          'use the ' + chalk.cyan('--bail') + ' option, if you wish otherwise.)');
      }
      return null;
    })(),
    ' ', //chalk.bgBlack.white(' '),
    chalk.magenta.bold(foo),
    // chalk.magenta.bold(String(msg.error ? msg.error : JSON.stringify(msg)).replace(/\n/g, '\n\t')),
    '\n\n'
  ].filter(item => item).join('\n\t'); //filter out null/undefined

  resultBroadcaster.emit(String(events.FATAL_TEST_ERROR), message);

};
