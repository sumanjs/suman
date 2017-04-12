#!/usr/bin/env node

///////////////////////////////////////////////////////////////////

debugger;  //leave here forever so users can easily debug with "node --inspect" or "node debug"

///////////////////////////////////////////////////////////////////

/*
 Note for the reader: Suman uses dashdash to parse command line arguments
 We found dashdash to be a better alternative to other option parsers
 => https://github.com/trentm/node-dashdash
 */

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');


const logExit = require('./lib/helpers/log-exit');

process.on('exit', function (code) {
  if (process.listenerCount('exit') === 1) {
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

console.log(' => Resolved path of Suman executable =>', '"' + __filename + '"');
const weAreDebugging = require('./lib/helpers/we-are-debugging');

if (weAreDebugging) {
  console.log(' => Suman is in debug mode (we are debugging).');
  console.log(' => Process PID => ', process.pid);
}

/////////////////////////////////////////////////////////////////

function handleExceptionsAndRejections() {
  if (_suman.sumanOpts && (_suman.sumanOpts.ignore_uncaught_exceptions || _suman.sumanOpts.ignore_unhandled_rejections)) {
    console.error('\n => uncaughtException occurred, but we are ignoring due to the ' +
      '"--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" flag(s) you passed.');
  }
  else {
    console.error('\n => Use "--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" to potentially debug further,' +
      'or simply continue in your program.\n\n');
    // process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    process.exit(59);
  }
}

process.on('uncaughtException', function (err) {

  if (typeof err !== 'object') {
    err = {stack: typeof err === 'string' ? err : util.inspect(err)}
  }

  if (String(err.stack || err).match(/Cannot find module/i) && _suman.sumanOpts && _suman.sumanOpts.transpile) {
    console.log(' => If transpiling, you may need to transpile your entire test directory to the destination directory using the ' +
      '--transpile and --all options together.')
  }

  if (process.listenerCount('uncaughtException') === 1) {
    if (err && !err._alreadyHandledBySuman) {
      err._alreadyHandledBySuman = true;
      console.error('\n\n => Suman "uncaughtException" event occurred =>\n', err.stack, '\n\n');
      handleExceptionsAndRejections();
    }
  }

});

process.on('unhandledRejection', function (err) {

  if (typeof err !== 'object') {
    err = {stack: typeof err === 'string' ? err : util.inspect(err)}
  }

  if (err && !err._alreadyHandledBySuman) {
    err._alreadyHandledBySuman = true;
    console.error('\n\n => Suman "unhandledRejection" event occurred =>\n', (err.stack || err), '\n\n');
    handleExceptionsAndRejections();
  }

});



//core
const fs = require('fs');
const path = require('path');
const os = require('os');
const domain = require('domain');
const cp = require('child_process');
const vm = require('vm');
const assert = require('assert');
const EE = require('events');
const util = require('util');

//npm
const semver = require('semver');
const dashdash = require('dashdash');
const colors = require('colors/safe');
const async = require('async');
const uniqBy = require('lodash.uniqby');
const events = require('suman-events');
const debug = require('suman-debug')('s:cli');
const uuid = require('uuid/v4');

//project
const _suman = global.__suman = (global.__suman || {});
require('./lib/patches/all');
const constants = require('./config/suman-constants');
const su = require('suman-utils');

//////////////////////////////////////////////////////////////////////////

debug([' => Suman started with the following command:', process.argv]);
debug([' => $NODE_PATH is as follows:', process.env.NODE_PATH]);

//////////////////////////////////////////////////////////////////////////

const nodeVersion = process.version;
const oldestSupported = constants.OLDEST_SUPPORTED_NODE_VERSION;

if (semver.lt(nodeVersion, oldestSupported)) {
  console.error(colors.red(' => Suman warning => Suman is not well-tested against Node versions prior to ' +
    oldestSupported + ', your version: ' + nodeVersion));
  throw new Error('Please upgrade to a newer Node.js version.');
}

console.log(' => Node.js version:', nodeVersion);

////////////////////////////////////////////////////////////////////

const pkgJSON = require('./package.json');
const sumanVersion = process.env.SUMAN_GLOBAL_VERSION = pkgJSON.version;
console.log(colors.yellow.italic(' => Suman v' + sumanVersion + ' running...'));
console.log(' => [pid] => ', process.pid);

////////////////////////////////////////////////////////////////////

// all global config options reside here
_suman.startTime = Date.now();
const cwd = process.cwd();

////////////////////////////////////////////////////////////////////

const sumanExecutablePath = _suman.sumanExecutablePath = process.env.SUMAN_EXECUTABLE_PATH = __filename;
let projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT = su.findProjectRoot(cwd);

const cwdAsRoot = process.argv.indexOf('--cwd-is-root') > -1;

if (!projectRoot) {
  if (!cwdAsRoot) {
    console.log(' => Warning => A NPM/Node.js project root could not be found given your current working directory.');
    console.log(colors.red.bold(' => cwd:', cwd, ' '));
    console.log('\n', colors.red.bold('=> Please execute the suman command from within the root of your project. '), '\n');
    console.log('\n', colors.blue.bold('=> (Perhaps you need to run "npm init" before running "suman --init", ' +
        'which will create a package.json file for you at the root of your project.) ') + '\n');
    return process.exit(1);
  }
  else {
    projectRoot = _suman.projectRoot = process.env.SUMAN_PROJECT_ROOT = cwd;
  }
}

////////////////////////////////////////////////////////////////////

const sumanOpts = _suman.sumanOpts = require('./lib/parse-cmd-line-opts/parse-opts');
_suman.sumanArgs = sumanOpts._args;

if (sumanOpts.verbose) {
  console.log(' => Suman verbose message => Project root:', projectRoot);
}

////////////////////////////////////////////////////////////////////

if (cwd !== projectRoot) {
  if (!sumanOpts.vsparse) {
    console.log(' => Note that your current working directory is not equal to the project root:');
    console.log(' => cwd:', colors.magenta(cwd));
    console.log(' => Project root:', colors.magenta(projectRoot));
  }
}
else {
  if (!sumanOpts.sparse) {
    if (cwd === projectRoot) {
      console.log(colors.gray(' => cwd:', cwd));
    }
  }
  if (cwd !== projectRoot) {
    console.log(colors.magenta(' => cwd:', cwd));
  }
}

const viaSuman = _suman.viaSuman = true;
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

/////////////////////////////////////////////////////////////////////

let sumanConfig, pth;

//TODO: use harmony destructuring args later on
const configPath = sumanOpts.config;
const serverName = sumanOpts.server_name;
const convert = sumanOpts.convert;
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
const uninstallBabel = sumanOpts.uninstall_babel;
const groups = sumanOpts.groups;
const useTAPOutput = sumanOpts.use_tap_output;
const fullStackTraces = sumanOpts.full_stack_traces;
const coverage = sumanOpts.coverage;
const diagnostics = sumanOpts.diagnostics;
const installGlobals = sumanOpts.install_globals;
const postinstall = sumanOpts.postinstall;

if (coverage) {
  console.log(colors.magenta.bold(' => Coverage reports will be written out due to presence of --coverage flag.'));
}

//re-assignable
let babelRegister = sumanOpts.babel_register;
let noBabelRegister = sumanOpts.no_babel_register;
const originalTranspileOption = sumanOpts.transpile = !!sumanOpts.transpile;

//////////////////////////////////

let sumanInstalledLocally = null;
let sumanInstalledAtAll = null;
let sumanServerInstalled = null;

///////////////////////////////////

if (sumanOpts.version) {
  console.log(' => Node.js version:', process.version);
  console.log('...And we\'re done here.', '\n');
  return;
}

//////////////// check for cmd line contradictions ///////////////////////////////////

function makeThrow(msg) {
  console.log('\n\n');
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
  if (sumanOpts.verbose) {  //default to true
    console.log(' => Suman verbose message => Suman config used: ' + pth);
  }

}
catch (err) {

  console.log(colors.bgBlack.yellow(' => Suman warning => Could not find path to your config file ' +
    'in your current working directory or given by --cfg at the command line...'));
  console.log(colors.bgBlack.yellow(' => ...are you sure you issued the suman command in the right directory? ' +
    '...now looking for a config file at the root of your project...'));

  try {
    pth = path.resolve(projectRoot + '/' + 'suman.conf.js');
    sumanConfig = _suman.sumanConfig = require(pth);
    if (!sumanOpts.sparse) {  //default to true
      console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
    }
  }
  catch (err) {

    // if (!uninstall) {
    //     if (!String(err.stack || err).match(/Cannot find module\.*suman\.conf\.js/)) {
    //         throw new Error(' => Suman message => Warning - no configuration (suman.conf.js) ' +
    //             'found in the root of your project.\n  ' + (err.stack || err));
    //     }
    //     else {
    //         throw new Error(colors.red(' => Suman usage error => There was an error loading your suman.conf.js file =>')
    //             + '\n ' + (err.stack || err));
    //     }

    _suman.usingDefaultConfig = true;
    console.log(' => Suman warning => Using default configuration file, please create your suman.conf.js ' +
      'file using suman --init.');

    sumanConfig = _suman.sumanConfig = require('./lib/default-conf-files/suman.default.conf');

    // }
    // else {
    //     // if we read in the default config, then package.json is not resolved correctly
    //     // we need to provide some default values though
    //     sumanConfig = _suman.sumanConfig = {
    //         sumanHelpersDir: 'suman'
    //     };
    // }
  }

}

if (init) {
  console.log(colors.magenta(' => "suman --init" is running.'));
  // TODO: force empty config if --init option given?
  sumanConfig = _suman.sumanConfig = _suman.sumanConfig || {};
}
else {

  const installObj = require('./lib/helpers/determine-if-suman-is-installed')(sumanConfig, sumanOpts);
  sumanInstalledAtAll = installObj.sumanInstalledAtAll;
  sumanServerInstalled = installObj.sumanServerInstalled;
  sumanInstalledLocally = installObj.sumanInstalledLocally;
}

debug(' => Suman configuration (suman.conf.js) => ', sumanConfig);

const sumanPaths = require('./lib/helpers/resolve-shared-dirs')(sumanConfig, projectRoot, sumanOpts);
const sumanObj = require('./lib/helpers/load-shared-objects')(sumanPaths, projectRoot, sumanOpts);

/////////////////////////////////////////////////////////////////////////////////////////////////////////

if (sumanConfig.transpile === true && sumanConfig.useBabelRegister === true && sumanOpts.verbose) {
  console.log('\n\n', ' => Suman warning => both the "transpile" and "useBabelRegister" properties are set to true in your config.\n' +
    '  The "transpile" option will tell Suman to transpile your sources to the "test-target" directory, whereas', '\n',
    ' "useBabelRegister" will transpile your sources on the fly and no transpiled files will be written to the filesystem.', '\n');

}

///////////////////// HERE WE RECONCILE / MERGE COMMAND LINE OPTS WITH CONFIG ///////////////////////////

if ('concurrency' in sumanOpts) {
  assert(Number.isInteger(sumanOpts.concurrency) && Number(sumanOpts.concurrency) > 0,
    colors.red(' => Suman usage error => "--concurrency" option value should be an integer greater than 0.'));
}

_suman.maxProcs = sumanOpts.concurrency || sumanConfig.maxParallelProcesses || 15;
sumanOpts.useTAPOutput = _suman.useTAPOutput = sumanConfig.useTAPOutput || useTAPOutput;
sumanOpts.full_stack_traces = sumanConfig.fullStackTraces || sumanOpts.full_stack_traces;

/////////////////////////////////// matching ///////////////////////////////////////

/*

 if matchAny is passed it overwrites anything in suman.conf.js, same goes for matchAll, matchNone
 however, if appendMatchAny is passed, then it will append to the values in suman.conf.js

 */
const sumanMatchesAny = (matchAny || (sumanConfig.matchAny || []).concat(appendMatchAny || []))
.map(item => (item instanceof RegExp) ? item : new RegExp(item));

if (sumanMatchesAny.length < 1) {
  // if the user does not provide anything, we default to this
  sumanMatchesAny.push(/\.js$/);
}

const sumanMatchesNone = (matchNone || (sumanConfig.matchNone || []).concat(appendMatchNone || []))
.map(item => (item instanceof RegExp) ? item : new RegExp(item));

const sumanMatchesAll = (matchAll || (sumanConfig.matchAll || []).concat(appendMatchAll || []))
.map(item => (item instanceof RegExp) ? item : new RegExp(item));

_suman.sumanMatchesAny = uniqBy(sumanMatchesAny, item => item);
_suman.sumanMatchesNone = uniqBy(sumanMatchesNone, item => item);
_suman.sumanMatchesAll = uniqBy(sumanMatchesAll, item => item);

////////////////////////////// override transpile /////////////////////////////////////////////////

if (sumanOpts.no_transpile) {
  sumanOpts.transpile = false;
}
else {

  if (sumanConfig.transpile === true) {
    sumanOpts.transpile = true;
    if (sumanOpts.verbose && !sumanOpts.watch) {
      console.log('\n', colors.bgCyan.black.bold('=> Suman message => transpilation is the default due to ' +
        'your configuration option => transpile:true'), '\n');
    }
  }

  debug(' => "babelRegister" opt => ', babelRegister);
  debug(' => "noBabelRegister" opt => ', noBabelRegister);

  const useBabelRegister = sumanOpts.transpile && (babelRegister || (!noBabelRegister && sumanConfig.useBabelRegister));

  if (babelRegister && !sumanOpts.transpile) {
    console.log(colors.red.bold(' => Warning => Looks like you intend to use babel-register, ' +
      'but the transpile flag is set to false.'));
  }

  if (useBabelRegister) {
    sumanOpts.useBabelRegister = true;
    process.env.USE_BABEL_REGISTER = 'yes';

    if (!sumanOpts.vsparse) {
      if (sumanConfig.transpile === true) {
        console.log('\n ', colors.bgCyan.black.bold(' => the ' + colors.magenta('--babel-register')
            + ' flag was passed or ' + colors.magenta('useBabelRegister')
            + ' was set to true in your suman.conf.js file,') + '\n  ' +
          colors.bgCyan.black.bold(' so we will transpile on the fly with "babel-register",' +
            ' no transpiled files will be written out.'), '\n');
      }
      else {
        if (babelRegister && sumanOpts.verbose) {
          console.log('\n', colors.bgCyan.black.bold('=> Suman message => ' + colors.magenta('--babel-register')
              + ' flag passed or useBabelRegister is' +
              'set to true in your suman.conf.js file, so we will transpile your sources on the fly,') + '\n' +
            colors.bgCyan.black.bold('no transpiled files will be written out.'), '\n');
        }
        else if (sumanOpts.verbose) {
          console.log('\n', colors.bgCyan.black.bold(' => Suman message => "useBabelRegister" property set to true in your config,' +
              ' so we will transpile your sources on the fly.') + '\n ' +
            colors.bgCyan.black.bold(' No transpiled files will be written out. '), '\n');
        }
      }
    }

  }
}

/////////////////////////////// abort if too many top-level options /////////////////////////////////////////////

const preOptCheck = {
  watch: watch,
  create: create,
  useServer: useServer,
  useBabel: useBabel,
  useIstanbul: useIstanbul,
  init: init,
  uninstall: uninstall,
  convert: convert,
  groups: groups,
  s: s,
  tailTest: tailTest,
  tailRunner: tailRunner,
  interactive: interactive,
  uninstallBabel: uninstallBabel,
  diagnostics: diagnostics,
  installGlobals: installGlobals,
  postinstall: postinstall
  //TODO: should mix this with uninstall-suman
};

const optCheck = Object.keys(preOptCheck).filter(function (key, index) {

  const value = preOptCheck[key];
  if (value) {
    debug(' => filtering item at index => ', index, ', item => ', value);
  }
  return value;

}).map(function (key) {
  const value = preOptCheck[key];
  const obj = {};
  obj[key] = value;
  return obj;
});

if (optCheck.length > 1) {
  console.error('\t => Too many options, pick one from  { --convert, --init, --server, --use-babel, --uninstall --tail-test, --tail-runner }');
  console.error('\t => Current options used were => ', util.inspect(optCheck));
  console.error('\t => Use --help for more information.\n');
  console.error('\t => Use --examples to see command line examples for using Suman in the intended manner.\n');
  process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
  return;
}

/////////////////////////////// load reporters  ////////////////////////////////

require('./lib/helpers/load-reporters')(sumanOpts, projectRoot, sumanConfig);

////////////////////////////////////////////////////////////////////////////////

resultBroadcaster.emit(String(events.NODE_VERSION), nodeVersion);
resultBroadcaster.emit(String(events.SUMAN_VERSION), sumanVersion);

//note: whatever args are remaining are assumed to be file or directory paths to tests

const userArgs = _suman.userArgs = [];

const paths = JSON.parse(JSON.stringify(sumanOpts._args)).filter(function (item) {
  if (String(item).indexOf('-') === 0) {
    if (sumanOpts.verbosity > 3) {
      console.log(colors.magenta(' => Suman considers this a user argument => ', "'" + item + "'"));
    }
    userArgs.push(item);
    return false;
  }
  return true;
});

if (sumanOpts.verbose) {
  console.log(' => Suman verbose message => arguments assumed to be test file paths to be run:', paths);
  if (paths.length < 1) {
    console.log(' => Suman verbose message => Since no paths were passed at the command line, we \n' +
      'default to running tests from the "testSrc" directory (defined in your suman.conf.js file).');
  }
}

///////////////////////////// slack message //////////////////////////////

//TODO: also can load any deps that are needed (babel, instanbul, suman-inquirer, etc), here, instead of elsewhere
require('./lib/helpers/slack-integration.js')({optCheck: optCheck}, function () {

  if (diagnostics) {
    require('./lib/cli-commands/run-diagnostics')();
  }
  else if (postinstall) {
    require('./lib/cli-commands/postinstall');
  }
  else if (installGlobals) {
    require('./lib/cli-commands/install-global-deps')(paths);
  }
  else if (interactive) {
    require('./lib/interactive');
  }
  else if (uninstallBabel) {
    require('./lib/use-babel/uninstall-babel')(null);
  }
  else if (useIstanbul) {
    require('./lib/use-istanbul/use-istanbul')();
  }
  else if (tail) {
    require('./lib/make-tail/tail-any')(paths);
  }
  else if (create) {
    require('./lib/create-opt/create')(create);
  }
  else if (useServer) {
    require('./lib/use-server/use-server')(null);
  }
  else if (useBabel) {
    require('./lib/use-babel/use-babel')(null);
  }
  else if (init) {

    require('./lib/init/init-project')({
      force: force,
      fforce: fforce
    });

  }
  else if (uninstall) {
    require('./lib/uninstall/uninstall-suman')({
      force: force,
      fforce: fforce,
      removeBabel: removeBabel,
    });
  }
  else if (convert) {
    require('./lib/helpers/convert-mocha')(projectRoot, src, dest, force);

  }
  else if (s) {
    require('./lib/helpers/start-server')(sumanServerInstalled, sumanConfig, serverName);
  }
  else if (watch) {
    require('./lib/watching/watch-init')(paths, sumanServerInstalled);
  }

  else if (groups) {
    require('./lib/groups/groups.js')(paths);
  }

  else {
    //this path runs all tests

    if (userArgs && sumanOpts.verbosity > 4) {
      console.log(' => User args will be passed to child processes as process.argv')
    }

    if (sumanOpts.verbosity > 4) {
      console.log(' => Suman considers these to be runnable files/directories => ');
      paths.forEach(function (f) {
        console.log(' => ', f);
      });
    }

    require('./lib/run')(sumanOpts, paths, sumanServerInstalled, sumanVersion);
  }

});

