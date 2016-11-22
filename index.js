#!/usr/bin/env node --harmony

///////////////////////////////////////////////////////////////////

debugger;  //leave here forever so users can easily debug with "node --inspect" or "node debug"

///////////////////////////////////////////////////////////////////

//
// for debugging:

// Object.defineProperty(global, 'integPath', {
//    set: function(){
//      console.error(new Error('integPath set').stack);
//    }
// });

if (require.main !== module && process.env.SUMAN_EXTRANEOUS_EXECUTABLE !== 'yes') {
  //prevents users from f*king up by accident and getting in some possible infinite process-spawn
  //loop that will lock up their entire system
  console.log('Warning: attempted to require Suman index.js but this cannot be.');
  return;
}

// var sigintCount = 0;
// TODO: add shutdown hooks for runner too
// process.on('SIGINT', () => {
// 	console.log('Suman got your SIGINT => Press Control-C *twice* to exit.');
// 	sigintCount++;
// 	if (sigintCount > 1) {
// 		process.exit(130);
// 	}
// });

const weAreDebugging = require('./lib/helpers/we-are-debugging');

if (weAreDebugging) {
  console.log(' => Suman is in debug mode (we are debugging).');
  console.log(' => Process PID => ', process.pid);
}

/////////////////////////////////////////////////////////////////

function handleExceptionsAndRejections () {

  if (global.sumanOpts && (global.sumanOpts.ignoreUncaughtExceptions || global.sumanOpts.ignoreUnhandledRejections)) {
    console.error('\n => uncaughtException occurred, but we are ignoring due to the ' +
      '"--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" flag(s) you passed.');
  }
  else {
    console.error('\n => Use "--ignore-uncaught-exceptions" / "--ignore-unhandled-rejections" to potentially debug further,' +
      'or simply continue in your program.\n\n');
    process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
  }
}

process.on('uncaughtException', function (err) {

  if (typeof err !== 'object') {
    err = { stack: typeof err === 'string' ? err : util.inspect(err) }
  }

  if (String(err.stack || err).match(/Cannot find module/i) && global.sumanOpts && global.sumanOpts.transpile) {
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
    err = { stack: typeof err === 'string' ? err : util.inspect(err) }
  }

  if (err && !err._alreadyHandledBySuman) {
    err._alreadyHandledBySuman = true;
    console.error('\n\n => Suman "unhandledRejection" event occurred =>\n', (err.stack || err), '\n\n');
    handleExceptionsAndRejections();
  }

});

const fs = require('fs');
const path = require('path');
const os = require('os');
const domain = require('domain');
const cp = require('child_process');
const vm = require('vm');
const assert = require('assert');
const EE = require('events');
const util = require('util');

//#npm
const semver = require('semver');
const dashdash = require('dashdash');
const colors = require('colors/safe');
const async = require('async');
const _ = require('lodash');

//#project
const constants = require('./config/suman-constants');
const sumanUtils = require('suman-utils/utils');

////////////////////////////////////////////////////////////////////

if (process.env.SUMAN_DEBUG === 'yes') {
  console.log('\n\n', ' => Suman started with the following command:', '\n', process.argv, '\n');
}

////////////////////////////////////////////////////////////////////

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
const sumanVersion = pkgJSON.version;
console.log(colors.yellow.italic(' => Suman v' + sumanVersion + ' running...'));

////////////////////////////////////////////////////////////////////

const cwd = process.cwd();

////////////////////////////////////////////////////////////////////

const sumanExecutablePath = global.sumanExecutablePath = process.env.SUMAN_EXECUTABLE_PATH = __filename;
const projectRoot = global.projectRoot = process.env.SUMAN_PROJECT_ROOT = sumanUtils.findProjectRoot(cwd);

if (!projectRoot) {
  console.log(' => Warning => A NPM/Node.js project root could not be found given your current working directory.');
  console.log(colors.bgRed.white.bold(' => cwd:', cwd, ' '));
  console.log(' => Please execute the suman command from within the root of your project.\n\n');
  return;
}

////////////////////////////////////////////////////////////////////

const opts = global.sumanOpts = require('./lib/parse-cmd-line-opts/parse-opts');
global.sumanArgs = opts._args;

if (opts.verbose) {
  console.log(' => Suman verbose message => Project root:', projectRoot);
}

////////////////////////////////////////////////////////////////////

if (cwd !== projectRoot) {
  if (!opts.vsparse) {
    console.log(' => CWD is not equal to project root:', cwd);
    console.log(' => Project root:', projectRoot);
  }
}
else {
  if (!opts.sparse) {
    if (cwd === projectRoot) {
      console.log(colors.gray(' => cwd:', cwd));
    }
  }
  if (cwd !== projectRoot) {
    console.log(colors.magenta(' => cwd:', cwd));
  }
}

const viaSuman = global.viaSuman = true;
const resultBroadcaster = global.resultBroadcaster = global.resultBroadcaster || new EE();

/////////////////////////////////////////////////////////////////////

var sumanConfig, pth;

//TODO: use harmony destructuring args later on
const configPath = opts.config;
const serverName = opts.server_name;
const convert = opts.convert;
const src = opts.src;
const dest = opts.dest;
const init = opts.init;
const uninstall = opts.uninstall;
const force = opts.force;
const fforce = opts.fforce;
const s = opts.server;
const tailRunner = opts.tail_runner;
const tailTest = opts.tail_test;
const useBabel = opts.use_babel;
const useServer = opts.use_server;
const tail = opts.tail;
const removeBabel = opts.remove_babel;
const create = opts.create;
const watch = opts.watch;
const useIstanbul = opts.use_istanbul;
const interactive = opts.interactive;
const matchAny = opts.match_any;
const matchAll = opts.match_all;
const matchNone = opts.match_none;
const uninstallBabel = opts.uninstall_babel;

//re-assignable
var register = opts.register;
var transpile = opts.transpile;
var originalTranspileOption = opts.transpile;

//////////////////////////////////
var sumanInstalledLocally = null;
var sumanInstalledAtAll = null;
var sumanServerInstalled = null;
///////////////////////////////////


if (opts.version) {
  console.log(' => Node.js version:', process.version);
  console.log('...And we\'re done here.', '\n');
  return;
}

if (opts.testing) {
  // this option is used to make sure we are talking to the right Suman module
  // (in case we are pointing to the wrong one).
  require('./lib/testing');
  return;
}

//////////////// check for cmd line contradictions ///////////////////////////////////

if (opts.transpile && opts.no_transpile) {
  console.log('\n', ' => Suman fatal problem => --transpile and --no-transpile options with both set, please choose one only.');
  return;
}

if (opts.watch && opts.stop_watching) {
  console.log('\n', ' => Suman fatal problem => --watch and --stop-watching options with both set, please choose one only.');
  return;
}

////////////////////////////////////////////////////////////////////////////////////

if (init) {
  global.usingDefaultConfig = true;
  sumanConfig = global.sumanConfig = {};
}
else {
  try {
    //TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test
    pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
    sumanConfig = global.sumanConfig = require(pth);
    if (opts.verbose) {  //default to true
      console.log(' => Suman verbose message => Suman config used: ' + pth);
    }

  }
  catch (err) {

    console.log(colors.bgBlack.yellow(' => Suman warning => Could not find path to your config file in your current working directory or given by --cfg at the command line...'));
    console.log(colors.bgBlack.yellow(' => ...are you sure you issued the suman command in the right directory? ...now looking for a config file at the root of your project...'));

    try {
      pth = path.resolve(projectRoot + '/' + 'suman.conf.js');
      sumanConfig = global.sumanConfig = require(pth);
      if (!opts.sparse) {  //default to true
        console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
      }
    }
    catch (err) {

      if (!uninstall) {
        if (String(err.stack || err).match(/Cannot find module\.*suman\.conf\.js/)) {
          throw new Error(' => Suman message => Warning - no configuration (suman.conf.js) ' +
            'found in the root of your project.\n  ' + (err.stack || err));
        }
        else {
          throw new Error(colors.red(' => Suman usage error => There was an error loading your suman.conf.js file =>')
            + '\n ' + (err.stack || err));
        }

      }
      else {
        // if we read in the default config, then package.json is not resolved correctly
        // we need to provide some default values though
        sumanConfig = global.sumanConfig = {
          sumanHelpersDir: 'suman'
        };
      }

      // note that we used to use to fallback on default configuration, but now we don't anymore
    }
  }
}

if (process.env.SUMAN_DEBUG === 'yes') {
  console.log(' => Suman configuration (suman.conf.js) => \n\n', util.inspect(sumanConfig));
}

if (!init) {
  const installObj = require('./lib/helpers/determine-if-suman-is-installed')(sumanConfig, opts);
  sumanInstalledAtAll = installObj.sumanInstalledAtAll;
  sumanServerInstalled = installObj.sumanServerInstalled;
  sumanInstalledLocally = installObj.sumanInstalledLocally;
}

const sumanPaths = require('./lib/helpers/resolve-shared-dirs')(sumanConfig, projectRoot);
const sumanObj = require('./lib/helpers/load-shared-objects')(sumanPaths, projectRoot);

/////////////////////////////////////////////////////////////////////////////////////////////////////////

if (sumanConfig.transpile === true && sumanConfig.useBabelRegister === true) {
  console.log('\n\n', ' => Suman warning => both the "transpile" and "useBabelRegister" properties are set to true in your config.\n' +
    '  The "transpile" option will tell Suman to transpile your sources to the "test-target" directory, whereas', '\n',
    ' "useBabelRegister" will transpile your sources on the fly and no transpiled files will be written to the filesystem.', '\n',
    ' The "useBabelRegister" property and --register flag will take precedence.');

  // 'The basic "transpile" option will take precedence over using "babel-register", since using "babel-register" is both' +
  // 'less performant and less transparent/debuggable.');
}

///////////////////// HERE WE RECONCILE / MERGE COMMAND LINE OPTS WITH CONFIG ///////////////////////////

if ('concurrency' in opts) {
  assert(Number.isInteger(opts.concurrency) && Number(opts.concurrency) > 0,
    colors.red(' => Suman error => "--concurrency" option value should be an integer greater than 0.'));
}

global.maxProcs = opts.concurrency || sumanConfig.maxParallelProcesses || 15;

/////////////////////// matching ///////////////////////////////////////

const sumanMatchesAny = (matchAny || []).concat(sumanConfig.matchAny || [])
  .map(item => (item instanceof RegExp) ? item : new RegExp(item));

if (sumanMatchesAny.length < 1) {
  // if the user does not provide anything, we default to this
  sumanMatchesAny.push(/\.js$/);
}

global.sumanMatchesAny = _.uniqBy(sumanMatchesAny, item => item);

global.sumanMatchesNone = _.uniqBy((matchNone || []).concat(sumanConfig.matchNone || [])
  .map(item => (item instanceof RegExp) ? item : new RegExp(item)), item => item);

global.sumanMatchesAll = _.uniqBy((matchAll || []).concat(sumanConfig.matchAll || [])
  .map(item => (item instanceof RegExp) ? item : new RegExp(item)), item => item);

/////////// override transpile ///////////
const overridingTranspile = opts.register || (!opts.no_register && global.sumanConfig.useBabelRegister);

if (opts.no_transpile) {
  opts.transpile = false;
}
else {

  if (!opts.no_transpile && sumanConfig.transpile === true) {
    transpile = opts.transpile = true;
    if (opts.verbose && !overridingTranspile && !opts.watch) {
      console.log('\n', colors.bgCyan.black.bold('=> Suman message => transpilation is the default due to ' +
        'your configuration option => transpile:true'), '\n');
    }
  }

  if (overridingTranspile) {
    if (!opts.vsparse) {
      if (global.sumanConfig.transpile === true) {
        console.log('\n ', colors.bgCyan.black.bold(' => Suman message => although transpilation is the default (due to ') + '\n  ' +
          colors.bgCyan.black.bold(' your configuration option => {transpile:true}), the ' + colors.magenta('--register') + ' flag was passed and takes precedence,') + '\n  ' +
          colors.bgCyan.black.bold(' so we will transpile on the fly with "babel-register", no transpiled files will be written out.'), '\n');
      }
      else {
        if (opts.register && opts.verbose) {
          console.log('\n', colors.bgCyan.black.bold('=> Suman message => --register flag passed, so we will transpile your sources on the fly,') + '\n' +
            colors.bgCyan.black.bold('no transpiled files will be written out.'), '\n');
        }
        else if (opts.verbose) {
          console.log('\n', colors.bgCyan.black.bold(' => Suman message => "useBabelRegister" property set to true in your config,' +
              ' so we will transpile your sources on the fly.') + '\n ' +
            colors.bgCyan.black.bold(' No transpiled files will be written out. '), '\n');
        }
      }
    }
    register = global.usingBabelRegister = opts.register = true;
    transpile = opts.transpile = false;  //when using register, we don't transpile manually
  }
}

//////////////////// abort if too many top-level options /////////////////////////////////////////////

const optCheck = [

  watch,
  create,
  useServer,
  useBabel,
  useIstanbul,
  init,
  uninstall,
  convert,
  s,
  tailTest,
  tailRunner,
  interactive,
  uninstallBabel   //TODO: should mix this with uninstall-suman

].filter(function (item) {
  return item; //TODO what if item is falsy?
});

if (optCheck.length > 1) {
  console.error('\t => Too many options, pick one from  { --convert, --init, --server, --use-babel, --uninstall --tail-test, --tail-runner }');
  console.error('\t => Use --help for more information.\n');
  console.error('\t => Use --examples to see command line examples for using Suman in the intended manner.\n');
  process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
  return;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

require('./lib/helpers/load-reporters')(opts, projectRoot, sumanConfig, resultBroadcaster);

resultBroadcaster.emit('node-version', nodeVersion);
resultBroadcaster.emit('suman-version', sumanVersion);

//note: whatever args are remaining are assumed to be file or directory paths to tests
const paths = JSON.parse(JSON.stringify(opts._args)).filter(function (item) {
  if (String(item).indexOf('-') === 0) {
    console.log(colors.magenta(' => Suman warning => Extra command line option "' + item + '", Suman is ignoring it.'));
    return false;
  }
  return true;
});

if (opts.verbose) {
  console.log(' => Suman verbose message => arguments assumed to be test file paths to be run:', paths);
  if (paths.length < 1) {
    console.log(' => Suman verbose message => Since no paths were passed at the command line, we \n' +
      'default to running tests from the "testSrc" directory (defined in your suman.conf.js file).');
  }
}

if (interactive) {
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

} else if (s) {

  require('./lib/helpers/start-server')(sumanServerInstalled, sumanConfig, serverName);

}
else if (watch) {

  require('./lib/helpers/watch-init')(paths, sumanServerInstalled);

}

else {

  //we do some work here
  require('./lib/run')(opts, paths, sumanServerInstalled, originalTranspileOption, sumanVersion);

}
