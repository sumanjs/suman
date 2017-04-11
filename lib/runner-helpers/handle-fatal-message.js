'use strict';

//core
const util = require('util');

//npm
const events = require('suman-events');
const su = require('suman-utils');
const colors = require('colors/safe');

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
    colors.bgMagenta.black.bold(' => Suman runner => there was a fatal test suite error - an error was encountered in ' +
      'your test code that prevents Suman '),
    colors.bgMagenta.black.bold(' from continuing with a particular test suite within the following path: '),
    ' ',
    colors.bgWhite.black.bold(' => ' + n.testPath + ' '),
    ' ', //colors.bgBlack.white(' '),
    (function () {
      if (!_suman.sumanOpts.sparse) {
        return colors.grey('(note that despite this fatal error, other test processes will continue running, as would be expected, ' +
          'use the ' + colors.cyan('--bail') + ' option, if you wish otherwise.)');
      }
      return null;
    })(),
    ' ', //colors.bgBlack.white(' '),
    colors.magenta.bold(foo),
    // colors.magenta.bold(String(msg.error ? msg.error : JSON.stringify(msg)).replace(/\n/g, '\n\t')),
    '\n\n'
  ].filter(item => item).join('\n\t'); //filter out null/undefined

  resultBroadcaster.emit(events.FATAL_TEST_ERROR, message);

};
