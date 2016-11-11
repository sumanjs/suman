'use striiict';

//core
const path = require('path');
const fs = require('fs');
const assert = require('assert');

//npm
const dashdash = require('dashdash');
const colors = require('colors/safe');

//project
const sumanUtils = require('suman-utils/utils');
const constants = require('../../config/suman-constants');

/////////////////////////////////////////////////////////////////

const options = require('./suman-options');

////////////////////////////////////////////////////////////////////

if (module.parent.filename === path.resolve(__dirname + '/../index')) {
  console.log(colors.bgRed('lib/index has required this file first.'));
}

/////////////////////////////////////////////////////////////////////

var opts, parser = dashdash.createParser({ options: options });

try {
  opts = parser.parse(process.argv);
} catch (err) {
  console.error(' => Suman command line options error: %s', err.message);
  console.error(' => Try "$ suman --help" or visit oresoftware.github.io/suman');
  process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
}

// Use `parser.help()` for formatted options help.
if (opts.help) {
  process.stdout.write('\n');
  var help = parser.help({ includeEnv: true }).trimRight();
  console.log('usage: suman [file/dir] [OPTIONS]\n\n'
    + colors.magenta('options:') + '\n'
    + help);
  process.stdout.write('\n');
  process.exit(0);
}

if (opts.concurrency) {
  assert(typeof opts.concurrency === 'number', '--concurrency value must be a positive integer');
  assert(opts.concurrency !== 0, '--concurrency value must be a positive integer');
}

if (opts.fforce) {
  opts.force = true;
}

if (opts.verbose && opts.verbose.length > 1) {
  opts.vverbose = true;
}

if (opts.vverbose) {
  opts.verbose = true;
}

if (opts.vsparse) {
  opts.sparse = true;
}

if (process.env.SUMAN_DEBUG == 'yes' || opts.vverbose) {
  console.log(' => Suman opts:\n', opts);
  console.log(' => Suman args:\n', opts._args);
}

/*

 note: moved this to index.js because suman.conf.js may set opts.transpile as well

 if (opts.transpile) {
 opts.recursive = true;
 }
 */

module.exports = opts;