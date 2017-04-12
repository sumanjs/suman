'use strict';

//polyfills
const global = require('suman-browser-polyfills/modules/global');
const process = require('suman-browser-polyfills/modules/process');

//core
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const util = require('util');

//npm
const dashdash = require('dashdash');
const colors = require('colors/safe');
const flattenDeep = require('lodash.flattendeep');
const flatten = require('lodash.flatten');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');
const constants = require('../../config/suman-constants');
const options = require('./suman-options');

////////////////////////////////////////////////////////////////////

if (module.parent && module.parent.filename === path.resolve(__dirname + '/../index')) {
  console.log(colors.bgRed('lib/index has required this file first.'));
}

/////////////////////////////////////////////////////////////////////

let opts, parser = dashdash.createParser({ options: options });

try {
  opts = parser.parse(process.argv);
} catch (err) {
  console.error(colors.red(' => Suman command line options error: %s'), err.message);
  console.error(' => Try "$ suman --help" or visit sumanjs.github.io');
  process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
}

if (opts.help) {
  process.stdout.write('\n');
  let help = parser.help({ includeEnv: true }).trimRight();
  console.log('usage: suman [file/dir] [OPTIONS]\n\n'
    + colors.magenta('options:') + '\n'
    + help);
  process.stdout.write('\n');
  process.exit(0);
}

if(opts.completion){
  console.log('\n');
  console.log(colors.cyan(' => The following output can be used for bash completion with the suman executable.'));
  console.log(colors.cyan(' => However, not that this is already available by using suman-clis.sh.'));
  let code = dashdash.bashCompletionFromOptions({
    name: 'suman',
    options: options
  });
  console.log(code);
  return process.exit(0);
}

if (opts.concurrency) {
  assert(typeof opts.concurrency === 'number', '--concurrency value must be a positive integer');
  assert(opts.concurrency !== 0, '--concurrency value must be a positive integer');
}

// console.log('opts before => ', util.inspect(opts));

options.filter(function (opt) {

  return String(opt.type).startsWith('arrayOf');

}).forEach(function (opt) {

  const n = String(opt.name || opt.names[ 0 ]).replace('-', '_');
  if (n in opts) {
    opts[ n ] = flattenDeep(opts[ n ].map(function (item) {
      // console.log('item => ', util.inspect(item));
      try {
        return flatten([ JSON.parse(item) ]);
      }
      catch (err) {
        return item;
      }
    }));
  }
});

// console.log('opts after => ', util.inspect(opts));

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

if (process.env.SUMAN_DEBUG === 'yes' || opts.vverbose) {
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
