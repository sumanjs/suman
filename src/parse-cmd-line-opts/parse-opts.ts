'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const global = require('suman-browser-polyfills/modules/global');
const process = require('suman-browser-polyfills/modules/process');

//core
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import os = require('os');

//npm
import dashdash = require('dashdash');
import chalk from 'chalk';
import flattenDeep = require('lodash.flattendeep');
import flatten = require('lodash.flatten');
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from '../config/suman-constants';
import {options} from './suman-options';
const IS_SUMAN_DEBUG = process.env['SUMAN_DEBUG'] === 'yes';

////////////////////////////////////////////////////////////////////

if (module.parent && module.parent.filename === path.resolve(__dirname + '/../index')) {
  console.log(chalk.bgRed('lib/index has required this file first.'));
}

/////////////////////////////////////////////////////////////////////

let opts, parser = dashdash.createParser({options});

try {
  opts = parser.parse(process.argv);
}
catch (err) {
  console.error(chalk.red(' => Suman command line options error: %s'), err.message);
  console.error(' => Try "suman --help" or visit sumanjs.org');
  process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
}

if (opts.help) {
  process.stdout.write('\n');
  let help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: suman [file/dir] [OPTIONS]\n\n'
    + chalk.magenta('options:') + '\n'
    + help);
  process.stdout.write('\n');
  process.exit(0);
}

if (opts.completion) {
  console.log('\n');
  console.log(chalk.cyan(' => The following output can be used for bash completion with the suman executable.'));
  console.log(chalk.cyan(' => However, not that this is already available by using suman-clis.sh.'));
  let bashCompletionData = dashdash.bashCompletionFromOptions({
    name: 'suman',
    options: options
  });
  console.log(bashCompletionData);
  process.exit(0);
}

if (opts.concurrency) {
  assert(typeof opts.concurrency === 'number', '--concurrency value must be a positive integer');
  assert(opts.concurrency !== 0, '--concurrency value must be a positive integer');
}

// forget what this is doing, maybe allowing for JSON.parse(optX), not sure

// console.log('opts before => ', util.inspect(opts));

// options.filter(function (opt) {
//   return String(opt.type).startsWith('arrayOf');
// })
// .forEach(function (opt) {
//
//   let n = String(opt.name || opt.names[0]).replace('-', '_');
//
//   if (n in opts) {
//     opts[n] = flattenDeep(opts[n].map(function (item) {
//       try {
//         return flatten([JSON.parse(item)]);
//       }
//       catch (err) {
//         return item;
//       }
//     }));
//   }
// });

// console.log('opts after => ', util.inspect(opts));

if (opts.fforce) {
  opts.force = true;
}

if (opts.per) {
  opts.watch_per = opts.per;
}

if (opts.debug_child && opts.inspect_child) {
  throw 'Please choose either "--debug-child" or "--inspect-child" option, they are exclusive.';
}

if (IS_SUMAN_DEBUG || opts.verbosity > 7) {
  console.log(' => Suman options:\n', opts);
  console.log(' => Suman arguments:\n', opts._args);
}

if (!Number.isInteger(opts.verbosity)) {
  console.error(' => [suman] => For whatever reason, opts.verbosity was not set by the CLI.');
  console.error(' => [suman] => We are manually setting it to the default value of 5.');
  opts.verbosity = 5;
}

module.exports = opts;
