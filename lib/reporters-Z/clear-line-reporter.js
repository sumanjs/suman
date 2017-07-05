'use strict';

//core
const util = require('util');

//npm
const {events} = require('suman-events');

//project
const _suman = global.__suman = (global.__suman || {});

function title (test) {
  return String(test.title || test.desc || test.description).replace(/#/g, '');
}

//////////////////////////////////////////////////////////

module.exports = s => {

//TODO: allow printing of just one line of results, until a failure
//readline.clearLine(process.stdout, 0);
//process.stdout.write('\r' + colors.green('Pass count: ' + successCount));

};

