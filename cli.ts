#!/usr/bin/env node
'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

debugger;  //leave here forever so users can easily debug with "node --inspect" or "node debug"

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');


/////////////////////////////////////////////////////////////////

let callable = true;

const logExit =  function(code: number){
  if(callable){
    callable = false;
    console.log('\n');
    console.log(' => Suman cli exiting with code: ', code);
    console.log('\n');
  }
};

process.once('exit', function (code: number) {
  if (!global.__suman || !global.__suman.isActualExitHandlerRegistered) {
    logExit(code);
  }
});

if (require.main !== module && process.env.SUMAN_EXTRANEOUS_EXECUTABLE !== 'yes') {
  //prevents users from f*king up by accident and getting in an infinite process-spawn
  //loop that will lock up their entire system
  console.log('Warning: attempted to require Suman index.js but this cannot be.\n' +
    'Set the SUMAN_EXTRANEOUS_EXECUTABLE env variable to "yes" to get around this.');
  process.exit(1);
}
else {
  delete process.env['SUMAN_EXTRANEOUS_EXECUTABLE'];
}


/////////////////////////////////////////////////////////////////

function handleExceptionsAndRejections() {
  if (_suman && _suman.sumanOpts && (_suman.sumanOpts.ignore_uncaught_exceptions || _suman.sumanOpts.ignore_unhandled_rejections)) {
    console.error('\n => uncaughtException occurred, but we are ignoring due to the ' +
      '"--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" flag(s) you passed.');
  }
  else {
    console.error('\n => Use "--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" ' +
      'to force suman to continue despite the error.');
    process.exit(59); // we have not necessarily loaded suman-constants yet, so we hardcode.
  }
}

process.on('uncaughtException', function (err: Error) {

  debugger; // leave debugger statement here

  if (typeof err !== 'object') {
    console.error(new Error(`err passed to uncaughtException was not an object => ${err}`).stack);
    err = new Error(typeof err === 'string' ? err : util.inspect(err))
  }

  if (String(err.stack || err).match(/Cannot find module/i) && _suman && _suman.sumanOpts && _suman.sumanOpts.transpile) {
    console.log(' => If transpiling, you may need to transpile your entire test directory to the destination directory using the ' +
      '--transpile and --all options together.')
  }

  setTimeout(function () {
    if (err && !err._alreadyHandledBySuman) {
      err._alreadyHandledBySuman = true;
      console.error('\n\n => Suman "uncaughtException" event occurred =>\n', err.stack, '\n\n');
      handleExceptionsAndRejections();
    }
  }, 500);

});

process.on('unhandledRejection', function (err: Error, p: Promise<any>) {

  debugger; // leave it here :)

  if (typeof err !== 'object') {
    console.error(new Error(`err passed to unhandledRejection was not an object => '${err}'`).stack);
    err = new Error(typeof err === 'string' ? err : util.inspect(err))
  }

  setTimeout(function () {
    if (err && !err._alreadyHandledBySuman) {
      err._alreadyHandledBySuman = true;
      console.error('\n\n => Suman "unhandledRejection" event occurred =>\n', (err.stack || err), '\n\n');
      handleExceptionsAndRejections();
    }
  }, 500);

});

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import os = require('os');
import domain = require('domain');
import vm = require('vm');
import tty = require('tty');

//npm
import semver = require('semver');
const dashdash = require('dashdash');
import * as chalk from 'chalk';
import async = require('async');
import su = require('suman-utils');
import _ = require('lodash');
const uniqBy = require('lodash.uniqby');
const {events} = require('suman-events');
const debug = require('suman-debug')('s:cli');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
require('./lib/helpers/add-suman-global-properties');
require('./lib/patches/all');
import {loadReporters} from './lib/helpers/load-reporters';
import {constants} from './config/suman-constants';
import {resolveSharedDirs, loadSharedObjects} from "./lib/helpers/general";

const weAreDebugging = su.weAreDebugging;

if (weAreDebugging) {
  console.log(' => Suman is in debug mode (we are debugging).');
  console.log(' => Process PID => ', process.pid);
}

//////////////////////////////////////////////////////////////////////////

debug([' => Suman started with the following command:', process.argv]);
debug([' => $NODE_PATH is as follows:', process.env['NODE_PATH']]);

//////////////////////////////////////////////////////////////////////////

_suman.log.info('Resolved path of Suman executable =>', '"' + __filename + '"');

const nodeVersion = process.version;
const oldestSupported = constants.OLDEST_SUPPORTED_NODE_VERSION;

if (semver.lt(nodeVersion, oldestSupported)) {
  _suman.log.error(chalk.red('warning => Suman is not well-tested against Node versions prior to ' +
    oldestSupported + '; your Node version: ' + chalk.bold(nodeVersion)));
  throw 'Please upgrade to a Node.js version newer than v4.0.0. Suman recommends usage of NVM.';
}

_suman.log.info('Node.js version:', chalk.bold(nodeVersion));

////////////////////////////////////////////////////////////////////

const sumanLibRoot = _suman.sumanLibRoot = String(__dirname);
const pkgJSON = require('./package.json');
const sumanVersion = process.env.SUMAN_GLOBAL_VERSION = pkgJSON.version;
_suman.log.info(chalk.italic('Suman ' + chalk.bold('v' + sumanVersion) + ' running...'));
_suman.log.info('[process.pid] => ', process.pid);

////////////////////////////////////////////////////////////////////

// all global config options reside here
_suman.startTime = Date.now();
const cwd = process.cwd();
const sumanExecutablePath = _suman.sumanExecutablePath = process.env.SUMAN_EXECUTABLE_PATH = __filename;
let projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT = su.findProjectRoot(cwd);

////////////////////////////////////////////////////////////////////

const cwdAsRoot = process.argv.indexOf('--cwd-is-root') > -1;

if (!projectRoot) {
  if (!cwdAsRoot) {
    console.log(' => Warning => A NPM/Node.js project root could not be found given your current working directory.');
    console.log(chalk.red.bold(' => cwd:', cwd, ' '));
    console.log('\n', chalk.red.bold('=> Please execute the suman command from within the root of your project. '), '\n');
    console.log('\n', chalk.blue.bold('=> (Perhaps you need to run "npm init" before running "suman --init", ' +
      'which will create a package.json file for you at the root of your project.) ') + '\n');
    process.exit(1);
  }
  else {
    projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT = cwd;
  }
}

////////////////////////////////////////////////////////////////////

const sumanOpts = _suman.sumanOpts = require('./lib/parse-cmd-line-opts/parse-opts');
_suman.sumanArgs = sumanOpts._args;

if (su.vgt(7)) {
  _suman.log.info('Project root:', projectRoot);
}

////////////////////////////////////////////////////////////////////

if (cwd !== projectRoot) {
  if (su.vgt(1)) {
    _suman.log.info('Note that your current working directory is not equal to the project root:');
    _suman.log.info('cwd:', chalk.magenta(cwd));
    _suman.log.info('Project root:', chalk.magenta(projectRoot));
  }
}
else {
  if (su.vgt(2)) {
    if (cwd === projectRoot) {
      _suman.log.info(chalk.gray('cwd:', cwd));
    }
  }
  if (cwd !== projectRoot) {
    _suman.log.info(chalk.magenta('cwd:', cwd));
  }
}

const viaSuman = _suman.viaSuman = true;
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

/////////////////////////////////////////////////////////////////////

let sumanConfig, pth;
const configPath = sumanOpts.config;
const serverName = sumanOpts.server_name;
const convert = sumanOpts.convert_from_mocha;
const src = sumanOpts.src;
const dest = sumanOpts.dest;
const init = sumanOpts.init;
const uninstall = sumanOpts.uninstall;
const force = sumanOpts.force;
const fforce = sumanOpts.fforce;
const s = sumanOpts.server;
const tailRunner = sumanOpts.tail_runner;
const tailTest = sumanOpts.tail_test;
const useBabel = sumanOpts.use_babel;
const useServer = sumanOpts.use_server;
const tail = sumanOpts.tail;
const removeBabel = sumanOpts.remove_babel;
const create = sumanOpts.create;
const watch = sumanOpts.watch;
const useIstanbul = sumanOpts.use_istanbul;
const interactive = sumanOpts.interactive;
const appendMatchAny = sumanOpts.append_match_any;
const appendMatchAll = sumanOpts.append_match_all;
const appendMatchNone = sumanOpts.append_match_none;
const matchAny = sumanOpts.match_any;
const matchAll = sumanOpts.match_all;
const matchNone = sumanOpts.match_none;
const repair = sumanOpts.repair;
const uninstallBabel = sumanOpts.uninstall_babel;
const groups = sumanOpts.groups;
const useTAPOutput = sumanOpts.use_tap_output;
const fullStackTraces = sumanOpts.full_stack_traces;
const coverage = sumanOpts.coverage;
const diagnostics = sumanOpts.diagnostics;
const installGlobals = sumanOpts.install_globals;
const postinstall = sumanOpts.postinstall;
const tscMultiWatch = sumanOpts.tsc_multi_watch;
const sumanShell = sumanOpts.suman_shell;
const watchPer = sumanOpts.watch_per;
const singleProcess = sumanOpts.single_process;
const script = sumanOpts.script;
const browser = sumanOpts.browser;

if (singleProcess) {
  process.env.SUMAN_SINGLE_PROCESS = 'yes';
}

if(watch || watchPer){
  if(process.env.SUMAN_WATCH_TEST_RUN === 'yes'){
    throw new Error('Suman watch process has launched a process which in turn will watch, this is not allowed.');
  }
}

if (sumanOpts.user_args) {
  _suman.log.info(chalk.magenta('raw user_args is'), sumanOpts.user_args);
}

const userArgs = sumanOpts.user_args = _.flatten([sumanOpts.user_args]).join(' ');

if (coverage) {
  _suman.log.info(chalk.magenta.bold('Coverage reports will be written out due to presence of --coverage flag.'));
}

//re-assignable
let babelRegister = sumanOpts.babel_register;
let noBabelRegister = sumanOpts.no_babel_register;
const originalTranspileOption = sumanOpts.transpile = Boolean(sumanOpts.transpile);

//////////////////////////////////

let sumanInstalledLocally = null;
let sumanInstalledAtAll = null;
let sumanServerInstalled = null;

///////////////////////////////////

if (sumanOpts.version) {
  console.log('\n');
  _suman.log.info('Node.js version:', nodeVersion);
  _suman.log.info('Suman version:', sumanVersion);
  _suman.log.info('...And we\'re done here.', '\n');
  process.exit(0);
}

//////////////// check for cmd line contradictions ///////////////////////////////////

function makeThrow(msg: string) {
  console.log('\n');
  console.error('\n');
  throw msg;
}

if (sumanOpts.transpile && sumanOpts.no_transpile) {
  makeThrow(' => Suman fatal problem => --transpile and --no-transpile options were both set,' +
    ' please choose one only.');
}

if (sumanOpts.append_match_all && sumanOpts.match_all) {
  makeThrow(' => Suman fatal problem => --match-all and --append-match-all options were both set,' +
    ' please choose one only.');
}

if (sumanOpts.append_match_any && sumanOpts.match_any) {
  makeThrow(' => Suman fatal problem => --match-any and --append-match-any options were both set,' +
    ' please choose one only.');
}

if (sumanOpts.append_match_none && sumanOpts.match_none) {
  makeThrow(' => Suman fatal problem => --match-none and --append-match-none options were both set,' +
    ' please choose one only.');
}

if (sumanOpts.watch && sumanOpts.stop_watching) {
  makeThrow('=> Suman fatal problem => --watch and --stop-watching options were both set, ' +
    'please choose one only.');
}

if (sumanOpts.babel_register && sumanOpts.no_babel_register) {
  makeThrow('=> Suman fatal problem => --babel-register and --no-babel-register command line options were both set,' +
    ' please choose one only.');
}

////////////////////////////////////////////////////////////////////////////////////

try {
  //TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test
  pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
  sumanConfig = _suman.sumanConfig = require(pth);
  if (sumanOpts.verbosity > 8) {  //default to true
    _suman.log.info(' => Suman verbose message => Suman config used: ' + pth);
  }

}
catch (err) {

  _suman.log.error(err.stack || err);

  if (!init) {
    // if init option is flagged to true, we don't expect user to have a suman.conf.js file, duh
    _suman.log.warning(chalk.bgBlack.yellow('warning => Could not load your config file ' +
      'in your current working directory or given by --cfg at the command line...'));
    _suman.log.warning(chalk.bgBlack.yellow(' => ...are you sure you issued the suman command in the right directory? ' +
      '...now looking for a config file at the root of your project...'));
  }

  try {
    pth = path.resolve(projectRoot + '/' + 'suman.conf.js');
    sumanConfig = _suman.sumanConfig = require(pth);
    if (sumanOpts.verbosity > 2) {  //default to true
      console.log(chalk.cyan(' => Suman config used: ' + pth + '\n'));
    }
  }
  catch (err) {

    _suman.usingDefaultConfig = true;
    _suman.log.warning('warning => Using default configuration file, please create your suman.conf.js ' +
      'file using "suman --init".');
    sumanConfig = _suman.sumanConfig = require('./lib/default-conf-files/suman.default.conf.js');
  }

}

if (init) {
  console.log(chalk.magenta(' => "suman --init" is running.'));
  // TODO: force empty config if --init option given?
  sumanConfig = _suman.sumanConfig = _suman.sumanConfig || {};
}
else {

  const {vetLocalInstallations} = require('./lib/cli-helpers/determine-if-suman-is-installed');
  const installObj = vetLocalInstallations(sumanConfig, sumanOpts, projectRoot);
  sumanInstalledAtAll = installObj.sumanInstalledAtAll;
  sumanServerInstalled = installObj.sumanServerInstalled;
  sumanInstalledLocally = installObj.sumanInstalledLocally;
}

const sumanPaths = resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
const sumanObj = loadSharedObjects(sumanPaths, projectRoot, sumanOpts);

///////////////////// Here we reconcile and merge command line args with config  ///////////////////////////
//////////////////// as usual, command line args take precedence over static configuration (suman.conf.js)

if (sumanOpts.parallel && sumanOpts.series) {
  throw chalk.red('suman usage error => "--series" and "--parallel" options were both used, ' +
    'please choose one or neither...but not both!');
}

if ('concurrency' in sumanOpts) {
  assert(Number.isInteger(sumanOpts.concurrency) && Number(sumanOpts.concurrency) > 0,
    chalk.red(' => Suman usage error => "--concurrency" option value should be an integer greater than 0.'));
}

_suman.maxProcs = sumanOpts.concurrency || sumanConfig.maxParallelProcesses || 15;
sumanOpts.$useTAPOutput = _suman.useTAPOutput = sumanConfig.useTAPOutput || useTAPOutput;
sumanOpts.$useTAPOutput && _suman.log.info('using TAP output => ', sumanOpts.$useTAPOutput);
sumanOpts.$fullStackTraces = sumanConfig.fullStackTraces || sumanOpts.full_stack_traces;

/////////////////////////////////// matching ///////////////////////////////////////

/* if matchAny is passed it overwrites anything in suman.conf.js, same goes for matchAll, matchNone
 however, if appendMatchAny is passed, then it will append to the values in suman.conf.js */

const sumanMatchesAny = (matchAny || (sumanConfig.matchAny || []).concat(appendMatchAny || []))
.map((item: RegExp | string) => (item instanceof RegExp) ? item : new RegExp(item));

if (sumanMatchesAny.length < 1) {
  // if the user does not provide anything, we default to this
  _suman.log.warning('no runnable file regexes available; using the default => /\.js$/');
  sumanMatchesAny.push(/\.js$/);
}

const sumanMatchesNone = (matchNone || (sumanConfig.matchNone || []).concat(appendMatchNone || []))
.map((item: RegExp | string) => (item instanceof RegExp) ? item : new RegExp(item));

const sumanMatchesAll = (matchAll || (sumanConfig.matchAll || []).concat(appendMatchAll || []))
.map((item: RegExp | string) => (item instanceof RegExp) ? item : new RegExp(item));

_suman.sumanMatchesAny = uniqBy(sumanMatchesAny, (item: RegExp) => item);
_suman.sumanMatchesNone = uniqBy(sumanMatchesNone, (item: RegExp) => item);
_suman.sumanMatchesAll = uniqBy(sumanMatchesAll, (item: RegExp) => item);

/////////////////////////////// abort if too many top-level options //////////////////////////////////////

export interface IPreOptCheck {
  [key: string]: any,
}

const preOptCheck = <IPreOptCheck> {
  tscMultiWatch, watch, watchPer,
  create, useServer, useBabel,
  useIstanbul, init, uninstall,
  convert, groups, s, interactive, uninstallBabel,
  diagnostics, installGlobals, postinstall,
  repair, sumanShell, script
};

const optCheck = Object.keys(preOptCheck).filter(function (key, index) {
  // we return non-falsy values
  return preOptCheck[key];
})
.map(function (key) {
  const value = preOptCheck[key];
  const obj = <Partial<IPreOptCheck>> {};
  obj[key] = value;
  return obj;
});

if (optCheck.length > 1) {
  console.error('\t => Too many options, pick one from:\n', util.inspect(Object.keys(preOptCheck)));
  console.error('\t => Current options used were:\n', util.inspect(optCheck));
  console.error('\t => Use --help for more information.\n');
  console.error('\t => Use --examples to see command line examples for using Suman in the intended manner.\n');
  process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
}

/////////////////////////////// load reporters  ////////////////////////////////

loadReporters(sumanOpts, projectRoot, sumanConfig);

////////////////////////////////////////////////////////////////////////////////

resultBroadcaster.emit(String(events.NODE_VERSION), nodeVersion);
resultBroadcaster.emit(String(events.SUMAN_VERSION), sumanVersion);

//note: whatever args are remaining are assumed to be file or directory paths to tests

let paths = _.flatten([sumanOpts._args]).slice(0);

if (sumanOpts.test_paths_json) {
  let jsonPaths = JSON.parse(String(sumanOpts.test_paths_json).trim());
  jsonPaths.forEach(function (p) {
    paths.push(p);
  });
}

if (sumanOpts.replace_match && sumanOpts.replace_with) {
  paths = paths.map(function (p) {
    return String(p).replace(sumanOpts.replace_match, sumanOpts.replace_with);
  });
}

if (sumanOpts.replace_ext_with) {
  paths = paths.map(function (p) {
    return String(p).substr(0, String(p).lastIndexOf('.')) + sumanOpts.replace_ext_with;
  });
}

if (su.vgt(7)) {
  console.log(' => Suman verbose message => arguments assumed to be test file paths to be run:', paths);
  if (paths.length < 1) {
    console.log(' => Suman verbose message => Since no paths were passed at the command line, we \n' +
      'default to running tests from the "testSrc" directory (defined in your suman.conf.js file).');
  }
}

if (sumanOpts.force_inherit_stdio) {
  _suman.$forceInheritStdio = true;
}

/////////////////// check to make sure --tap option is used if we are piping ////////////////////

let isTTY = process.stdout.isTTY;

if (!process.stdout.isTTY && !useTAPOutput) {
  _suman.log.error(chalk.red('you may need to turn on TAP output for test results to be captured in destination process.'));
}

////////////////////// dynamically call files to minimize load, etc //////////////////////////////

if (diagnostics) {
  require('./lib/cli-commands/run-diagnostics').run(sumanOpts);
}
else if (script) {
  require('./lib/cli-commands/run-scripts').run(sumanConfig, sumanOpts);
}
else if (tscMultiWatch) {
  require('./lib/cli-commands/run-tscmultiwatch').run(sumanOpts);
}
else if (repair) {
  require('./lib/cli-commands/run-repair').run(sumanOpts);
}
else if (postinstall) {
  require('./lib/cli-commands/postinstall').run(sumanOpts);
}
else if (installGlobals) {
  require('./lib/cli-commands/install-global-deps')(paths);
}
else if (sumanShell) {
  require('./lib/cli-commands/run-suman-shell').run(projectRoot, sumanLibRoot, sumanOpts.suman_d_opts)
}
else if (interactive) {
  require('./lib/cli-commands/run-suman-interactive').run();
}
else if (uninstallBabel) {
  require('./lib/use-babel/uninstall-babel')(null);
}
else if (useIstanbul) {
  require('./lib/use-istanbul/use-istanbul')();
}
else if (create) {
  require('./lib/cli-commands/create-opt').run(create);
}
else if (useServer) {
  require('./lib/use-server/use-server')(null);
}
else if (useBabel) {
  require('./lib/use-babel/use-babel')(null);
}
else if (init) {
  require('./lib/cli-commands/init-opt').run(sumanOpts, projectRoot, cwd);
}
else if (uninstall) {
  require('./lib/uninstall/uninstall-suman')({
    force: force,
    fforce: fforce,
    removeBabel: removeBabel,
  });
}
else if (convert) {
  require('./lib/cli-commands/convert-mocha').run(projectRoot, src, dest, force);
}
else if (s) {
  require('./lib/cli-commands/start-suman-server')(sumanServerInstalled, sumanConfig, serverName);
}
else if (!browser && (watch || watchPer)) {
  require('./lib/cli-commands/watching').run(projectRoot, paths, sumanOpts, sumanConfig);
}
else if (groups) {
  require('./lib/cli-commands/groups').run(paths);
}

else {
  //this path runs all tests
  if (userArgs.length > 0 && sumanOpts.verbosity > 4) {
    _suman.log.info('The following "--user-args" will be passed to child processes as process.argv:');
    _suman.log.info(userArgs);
  }

  require('./lib/run').run(sumanOpts, sumanConfig, paths, sumanServerInstalled, sumanVersion);
}



