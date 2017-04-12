'use strict';

import {Stream} from "stream";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

const util = require('util');
const Mod = require('module');
const req = Mod.prototype && Mod.prototype.require;

let inBrowser = false;
const _suman: ISumanGlobalInternal = global.__suman = (global.__suman || {});

// set it here just in case
const sumanOptsFromRunner = _suman.sumanOpts || (process.env.SUMAN_OPTS ? JSON.parse(process.env.SUMAN_OPTS) : {});
const sumanOpts = _suman.sumanOpts = (_suman.sumanOpts || sumanOptsFromRunner);

try {
  window.module = {filename: '/'};
  module.parent = module;
  inBrowser = _suman.inBrowser = true;
}
catch (err) {
  inBrowser = _suman.inBrowser = false;
}


if (_suman.sumanOpts.verbosity > 8) {
  console.log(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
}


let count = 0;

Mod.prototype && (Mod.prototype.require = function () {
  // console.log('count => ', count++, arguments);

  const args = Array.from(arguments);
  const lastArg = args[args.length - 1];

  const ret = req.apply(this, arguments);

  // console.log('number of children => ', this.children.length);
  //
  // let arr = this.children;
  // let len = arr.length;
  // arr[len - 1] && (arr[len - 1].exports = function(){
  //   throw new Error('You called this twice => ' + args[0]);
  // });

  // console.log('this => ', util.inspect(this));

  // this.exports = function(){
  //   throw new Error('You called this twice.');
  // };

  return ret;
});


let oncePostFn: Function;
const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
const fatalRequestReply = require('./helpers/fatal-request-reply');
const async = require('async');
const constants = require('../config/suman-constants');
const weAreDebugging = require('../lib/helpers/we-are-debugging');


if (process.env.SUMAN_DEBUG === 'yes') {
  console.log(' => Suman require.main => ', require.main.filename);
  console.log(' => Suman parent module => ', module.parent.filename);
}


process.on('warning', function (w: Error) {
  if (weAreDebugging) {
    // if we are debugging, log all warnings
    console.error(w.stack || w);
  }
  else if (!(/deprecated/i.test(String(w)))) {
    // there were some really useless warnings about deprecation
    // if the user wants to see deprecation warnings...they can add their own process.on('warning') handler, thx
    console.error(w.stack || w);
  }
});

process.on('uncaughtException', function (err: SumanErrorRace) {

  if (typeof err !== 'object') {
    console.log(colors.bgMagenta.black(' => Error is not an object => ', util.inspect(err)));
    err = {stack: typeof err === 'string' ? err : util.inspect(err)}
  }

  if (err._alreadyHandledBySuman) {
    console.error(' => Error already handled => \n', (err.stack || err));
  }
  else {

    sumanRuntimeErrors.push(err);
    const msg = err.stack || err;

    err._alreadyHandledBySuman = true;
    console.error('\n\n', colors.magenta(' => Suman uncaught exception => \n' + msg));

    if (String(msg).match(/suite is not a function/i)) {
      process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
        '\n\tsee sumanjs.github.io\n\n');
    }
    else if (String(msg).match(/describe is not a function/i)) {
      process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
        '\n\tsee sumanjs.github.io\n\n');
    }

    if (!_suman.sumanOpts || (_suman.sumanOpts && _suman.sumanOpts.ignoreUncaughtExceptions !== false)) {
      _suman.sumanUncaughtExceptionTriggered = true;
      console.error('\n\n', ' => Given uncaught exception,' +
        ' Suman will now run suman.once.post.js shutdown hooks...');
      console.error('\n\n', ' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
        'the "--ignore-uncaught-exceptions" option.)');

      async.parallel([

        function (cb: Function) {
          if (!oncePostFn) {
            console.error(' => Suman internal warning, oncePostFn not yet defined.');
            return process.nextTick(cb);
          }
          oncePostFn(cb);
        },
        function (cb: Function) {
          fatalRequestReply({
            type: constants.runner_message_type.FATAL,
            data: {
              error: msg,
              msg: msg
            }
          }, cb);
        }

      ], function (err: Error, resultz: Array<any>) {

        const results = resultz[0];

        if (err) {
          console.error(err.stack || err);
        }
        if (Array.isArray(results)) {  // once-post was actually run this time versus (see below)
          results.filter(r => r).forEach(function (r) {
            console.error(r.stack || r);
          });
          process.nextTick(function () {
            process.exit(88);
            // process.exit(constants.EXIT_CODES.UNCAUGHT_EXCEPTION_BEFORE_ONCE_POST_INVOKED);
          });
        }
        else { // once-post was previously/already run
          process.nextTick(function () {
            process.exit(89);
            // process.exit(constants.EXIT_CODES.UNCAUGHT_EXCEPTION_AFTER_ONCE_POST_INVOKED);
          });
        }
      });
    }
  }

});

process.on('unhandledRejection', (reason: any, p: Promise<any>) => {
  reason = (reason.stack || reason);
  console.error('Unhandled Rejection at: Promise ', p, '\n\n=> Rejection reason => ', reason, '\n\n=> stack =>', reason);

  if (!_suman.sumanOpts || (_suman.sumanOpts && _suman.sumanOpts.ignoreUncaughtExceptions !== false)) {
    _suman.sumanUncaughtExceptionTriggered = true;

    fatalRequestReply({
      type: constants.runner_message_type.FATAL,
      data: {
        error: reason,
        msg: reason
      }
    }, function () {
      process.exit(53); //have to hard-code in case suman-constants file is not loaded
    });

  }
});

/////////////////////////////////////////////////////////////////////

// core
const domain = require('domain');
const os = require('os');
const assert = require('assert');
const path = require('path');
const cp = require('child_process');
const EE = require('events');
const stream = require('stream');
const fs = require('fs');

// npm
const stack = require('callsite');
const colors = require('colors/safe');
const pragmatik = require('pragmatik');
const debug = require('suman-debug')('s:index');

// project
require('./patches/all');
const rules = require('./helpers/handle-varargs');
const makeSuman = require('./suman');
const su = require('suman-utils');
const acquireDeps = require('./acquire-deps');
const acquireIntegrantsSingleProcess = require('./acquire-integrants-single-proc');
const es = require('./exec-suite');
const fnArgs = require('function-arguments');
const makeIocDepInjections = require('./injection/ioc-injector');

///////////////////////////////////////////////////////////////////////////////////////////

//integrants
let integPreConfiguration: any = null;
const allOncePreKeys: Array<string> = _suman.oncePreKeys = [];
const allOncePostKeys: Array<string> = _suman.oncePostKeys = [];
const integrantsEmitter = _suman.integrantsEmitter = (_suman.integrantsEmitter || new EE());
const integProgressEmitter = _suman.integProgressEmitter = (_suman.integProgressEmitter || new EE());
const integContainer = _suman.integContainer = (_suman.integContainer || {});
const integProgressContainer = _suman.integProgressContainer = (_suman.integProgressContainer || {});

//ioc
const iocEmitter = _suman.iocEmitter = (_suman.iocEmitter || new EE());
const iocContainer = _suman.iocContainer = (_suman.iocContainer || {});
const iocProgressContainer = _suman.iocProgressContainer = (_suman.iocProgressContainer || {});

// results and reporters
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const sumanReporters = _suman.sumanReporters = (_suman.sumanReporters || []);
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());

////////////////////////////////////////////////////////////////////////////////////////////


const pkgDotJSON = require('../package.json');

let gv: string;

if (gv = process.env.SUMAN_GLOBAL_VERSION) {
  const lv = String(pkgDotJSON.version);

  debug(' => Global version => ', gv);
  debug(' => Local version => ', lv);

  if (gv !== lv) {
    console.error('\n\n', colors.red(' => Suman warning => You local version of Suman differs from the cli version of Suman.'));
    console.error(colors.cyan(' => Global version => '), gv);
    console.error(colors.cyan(' => Local version => '), lv, '\n\n');
  }
}

///////////////////////////////////////////////////////////////////////////////////////////

const counts = require('./helpers/suman-counts');
const cwd = process.cwd();
const projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(cwd) || '/';

////////////////////////////////////////////////////////////////////////////////////////////

require('./helpers/handle-suman-counts');
oncePostFn = require('./helpers/handle-suman-once-post');

////////////////////////////////////////////////////////////////////////

// here comes the hotstepper
// cache these values for purposes of SUMAN_SINGLE_PROCESS option

const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const isViaSumanWatch = process.env.SUMAN_WATCH === 'yes';
const main = require.main.filename;
const usingRunner = _suman.usingRunner = (_suman.usingRunner || process.env.SUMAN_RUNNER === 'yes');

//could potentially pass dynamic path to suman config here, but for now is static
const sumanConfig = require('./helpers/load-suman-config')(null);

if (!_suman.usingRunner && !_suman.viaSuman) {
  require('./helpers/print-version-info'); // just want to run this once
}

if (sumanOpts.verbose && !usingRunner && !_suman.viaSuman) {
  console.log(' => Suman verbose message => Project root:', projectRoot);
}

const sumanPaths = require('./helpers/resolve-shared-dirs')(sumanConfig, projectRoot, sumanOpts);
const sumanObj = require('./helpers/load-shared-objects')(sumanPaths, projectRoot, sumanOpts);

/////////// cannot wait to use obj destruring /////////////////////////////////
const integrantPreFn = sumanObj.integrantPreFn;
const iocFn = sumanObj.iocFn;
const testDebugLogPath = sumanPaths.testDebugLogPath;
const testLogPath = sumanPaths.testLogPath;

fs.writeFileSync(testDebugLogPath, '\n', {flag: 'w'});
fs.writeFileSync(testLogPath, '\n => New Suman run @' + new Date(), {flag: 'w'});

////////////////////////////////////////////////////////////////////////////////

if (sumanReporters.length < 1) {

  let fn: Function;

  if (_suman.sumanOpts.useTAPOutput) {
    if (_suman.sumanOpts.verbosity > 7) {
      console.log(' => Using TAP reporter.');
    }
    fn = require('./reporters/tap-reporter');
  }
  else {
    fn = require('./reporters/std-reporter');
  }
  assert(typeof fn === 'function', 'Native reporter fail.');
  _suman.sumanReporters.push(fn);
  fn.call(null, resultBroadcaster);
}

//////////////////////////////////////////////////////////////////////////////////////

namespace suman {

  export interface ILoadOpts {
    path: string,
    indirect: boolean
  }

  export interface Ioc {
    a: string,
    b: string
  }

  export interface IInitOpts {
    export?: boolean,
    __expectedExitCode?: number,
    pre?: Array<string>,
    integrants?: Array<string>,
    series?: boolean,
    writable?: boolean,
    timeout?: number,
    post?: Array<any>,
    interface?: string,
    iocData?: Object,
    ioc?: Object

  }

  export interface ICreate {
    create: Function
  }

  export interface IInit {
    (module: NodeModule, opts: IInitOpts): ICreate,
    $ingletonian?: any,
    tooLate?: boolean

  }

  export interface IInitExport {
    load: Function,
    autoPass: Function,
    autoFail: Function
    init: IInit,
    constants: Object,
    Writable: Function,
    Transform: Function,
    once: Function
  }
}


//////////////////////////////////////////////////////////////////////////////////////

let loaded = false;
let moduleCount = 0;

const init: suman.IInit = function ($module: ISumanModuleExtended, $opts: suman.IInitOpts, confOverride: any): IStartCreate {

  ///////////////////////////////////
  debugger;  // leave this here forever for debugging child processes

  /*
   Please note that the init function is complex by nature. Easily the most complicated function
   in this project by an order of magnitude. Here we have to deal with several different
   conditionals:

   (1) using runner or not
   (2) using suman or node
   (3) SUMAN_SINGLE_PROCESS (running tests all in a single process) or standard
   (4) Waiting for suman.once.pre to finish ("integrants")

   How this function works:

   Test.create/describe/suite are called synchronously; once that function is called,
   we wait for any relevant integrants to start/finish

   */
  ///////////////////////////////////

  if (init.$ingletonian) {
    if (process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
      console.error(colors.red(' => Suman usage warning => suman.init() only needs to be called once per test file.'));
      return init.$ingletonian;
    }
  }

  require('./handle-exit'); // handle exit here

  if (this instanceof init) {
    console.error('\n', ' => Suman usage warning: no need to use "new" keyword with the suman.init()' +
      ' function as it is not a standard constructor');
    return init.apply(null, arguments);
  }

  if (!inBrowser) {
    assert(($module.constructor && $module.constructor.name === 'Module'),
      'Please pass the test file module instance as first arg to suman.init()');
  }

  // if(!$module){
  //   confOverride = $opts;
  //   $opts = $module;
  //   $module = {filename: 'unknown (we are in browser)'};
  //   $module.parent = $module;
  //   $module.filename = '/';
  // }

  debugger;

  if (confOverride) {
    assert(confOverride && (typeof confOverride === 'object'), ' => Suman conf override value must be defined and an object.');
    assert(!Array.isArray(confOverride), ' => Suman conf override value must be an object, but not an array.');
    Object.assign(_suman.sumanConfig, confOverride);
  }

  _suman.sumanInitCalled = true;
  _suman.sumanInitStartDate = (_suman.sumanInitStartDate || Date.now());
  _suman._currentModule = $module.filename;
  _suman.SUMAN_TEST = 'yes';

  debug(' => Suman debug message => require.main.filename => ',
    '"' + require.main.filename + '"');

  debug(' => Suman debug message => suman index was required from module (module.parent) => ',
    module.parent.filename);

  if (module.parent && module.parent.parent) {
    debug(' => Suman debug message => (module.parent.parent) => ',
      module.parent.parent.filename);
  }

  if (module.parent && module.parent.parent && module.parent.parent.parent) {
    debug(' => Suman debug message => (module.parent.parent.parent) => ',
      module.parent.parent.parent.filename);
  }

  // TODO: could potention figure out what original test module is via suman.init call, instead of
  // requiring that user pass it explicitly

  if (!loaded) {

    //note that these calls need to be inside suman.init() so they don't get loaded by the runner, etc.
    //although perhaps we should put the runner code elsewhere, because user does not need to call runner
    //look through version control from Sunday Nov 20th for this code
  }

  if ($opts) {
    assert(typeof $opts === 'object' && !Array.isArray($opts),
      'Please pass an options object as a second argument to suman.init()');
  }

  let matches = false;
  if (usingRunner) { //when using runner cwd is set to project root or test file path
    if (process.env.SUMAN_CHILD_TEST_PATH === $module.filename) {
      matches = true;
    }
  }
  else {  //if we run
    if (_suman.sumanOpts.vverbose) {
      console.log(' => Suman vverbose message => require.main.filename value:', main);
    }
    if (main === $module.filename) {
      matches = true;
    }
  }

  const opts: suman.IInitOpts = $opts || {};

  const series = !!opts.series;
  const writable = opts.writable;

  if ($module._sumanInitted) {
    console.error(' => Suman warning => suman.init() already called for this module with filename => ', $module.filename);
    return;
  }

  $module._sumanInitted = true;
  moduleCount++;

  const testSuiteQueue: Array<Function> = $module.testSuiteQueue = [];

  suiteResultEmitter.on('suman-completed', function () {
    //this code should only be invoked if we are using Test.create's in series
    testSuiteQueue.pop();
    let fn: Function;
    if (fn = testSuiteQueue[testSuiteQueue.length - 1]) {
      debug(' => Running testSuiteQueue fn => ', String(fn));
      fn.call(null);
    }
    else {
      debug(' => Suman testSuiteQueue is empty.');
    }
  });

  // TODO: perhaps we could do some bookkeeping on $module itself so that only if init is called twice on that particular module
  // TODO: do we barf
  // TODO: validate that writable is actually a proper writable stream

  const exportEvents = $module.exports = (writable || Transform());

  exportEvents.counts = {
    sumanCount: 0
  };
  // const testsuites = exportEvents._testsuites = exportEvents._testsuites || [];

  Object.defineProperty($module, 'exports', {
    //freeze module exports to avoid horrible bugs
    writable: false
  });

  //TODO: allow users to have multiple suman.conf.js files for different tests in their project?
  // const configPath = opts.sumanConfigPath;

  let integrants = opts.integrants || opts.pre || [];
  assert(Array.isArray(integrants), '"integrants" must be an array type.');

  // remove falsy elements, for user convenience
  integrants = integrants.filter((i: any) => i);

  if (opts.__expectedExitCode !== undefined && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
    const expectedExitCode = _suman.expectedExitCode = _suman.expectedExitCode || opts.__expectedExitCode;
    assert(Number.isInteger(expectedExitCode) && expectedExitCode > -1, ' => Suman usage error => Expected exit ' +
      'code not an acceptable integer.');
  }

  if (opts.timeout !== undefined && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
    const timeout = _suman.expectedTimeout = opts.timeout;
    assert(Number.isInteger(timeout) && timeout > 0, ' => Suman usage error => Expected timeout value ' +
      'is not an acceptable integer.');

    setTimeout(function () {
      console.log('\n', new Error('=> Suman test file has timed out -' +
        ' "timeout" value passed to suman.init() has been reached exiting....').stack);
      process.exit(constants.EXIT_CODES.TEST_FILE_TIMEOUT);
    }, timeout);

  }

  const $oncePost = opts.post || [];
  assert(Array.isArray($oncePost), '"post" option must be an array type.');

  const waitForResponseFromRunnerRegardingPostList = $oncePost.length > 0;
  const waitForIntegrantResponses = integrants.length > 0;

  //pass oncePost so that we can use it later when we need to
  allOncePostKeys.push($oncePost);
  allOncePreKeys.push(integrants);

  const _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';

  const filenames = [
    $module.filename,
    require.resolve('./runner-helpers/run-child.js'),
    require.resolve('../cli.js')
  ];

  const exportTests = (opts.export === true || singleProc || _suman._sumanIndirect);
  const iocData = opts.iocData || opts.ioc || {};

  if (iocData) {
    try {
      assert(typeof iocData === 'object' && !Array.isArray(iocData),
        colors.red(' => Suman usage error => "ioc" property passed to suman.init() needs ' +
          'to point to an object'));
    }
    catch (err) {
      console.log(err.stack);
      process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
    }
  }

  if (exportTests) {
    //TODO: if export is set to true, then we need to exit if we are using the runner
    if (process.env.SUMAN_DEBUG === 'yes' || _suman.sumanOpts.vverbose) {
      console.log(colors.magenta(' => Suman message => export option set to true.'));
    }
  }

  //////////////////////////////////////////////////////////////////

  if (usingRunner) {

    // fs.writeFileSync(errStrmPath, '\n', {flags: 'a', encoding: 'utf8'});
    // fs.appendFileSync(errStrmPath, 'start', {flags: 'a'});

    _suman._writeTestError = function (data: string, options: any) {

      assert(typeof data === 'string', ' => Implementation error => data passed to ' +
        '_writeTestError should already be in string format => \n' + util.inspect(data));

      options = options || {};
      assert(typeof options === 'object', ' => Options should be an object.');

      if (true || process.env.SUMAN_DEBUG === 'yes') {
        fs.appendFileSync(testDebugLogPath, data);
      }

      // const data = Array.from(arguments).filter(i => i);
      //
      // data.forEach(function (d) {
      //
      //     if (typeof d !== 'string') {
      //         d = util.inspect(d);
      //     }
      //
      //     // process.stderr.write(d);  //goes to runner
      //
      //     if (process.env.SUMAN_DEBUG === 'yes') {
      //         fs.appendFileSync(testDebugLogPath, d);
      //     }
      // });

    };

    _suman._writeLog = function (data: string) {
      // use process.send to send data to runner? or no-op
      if (process.env.SUMAN_DEBUG === 'yes') {
        fs.appendFileSync(testDebugLogPath, data);
      }
    }
  }
  else {

    if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
      fs.writeFileSync(testLogPath,
        '\n => [SUMAN_SINGLE_PROCESS mode] Next Suman run @' + new Date() +
        '\n Test file => "' + $module.filename + '"', {flag: 'a'});
    }
    else {
      fs.writeFileSync(testLogPath,
        '\n\n => Test file => "' + $module.filename + '"\n\n', {flag: 'a'});
    }

    _suman._writeLog = function (data: string) {
      fs.appendFileSync(testLogPath, data);
    };

    _suman._writeTestError = function (data: string, ignore: boolean) {
      if (!ignore) {
        _suman.checkTestErrorLog = true;
      }
      // strm.write.apply(strm, arguments);
      fs.appendFileSync(testDebugLogPath, '\n' + data + '\n');
    };

    fs.writeFileSync(testDebugLogPath, '\n\n', {flags: 'a', encoding: 'utf8'});
    _suman._writeTestError('\n\n', true);
    _suman._writeTestError(' ### Suman start run @' + new Date(), true);
    _suman._writeTestError(' ### Filename => ' + $module.filename, true);
    _suman._writeTestError(' ### Command => ' + JSON.stringify(process.argv), true);
  }

  ////////////////////////////////////////////////////////////////

  let integrantsFn: Function = null;
  let integrantsReady: boolean = null;
  let postOnlyReady: boolean = null;

  if (waitForIntegrantResponses || process.env.SUMAN_SINGLE_PROCESS === 'yes') {
    integrantsReady = false;
  }

  if (waitForResponseFromRunnerRegardingPostList) {
    postOnlyReady = false;
  }

  if (integrants.length < 1) {
    integrantsFn = function (emitter: EventEmitter) {
      process.nextTick(function () {
        if (emitter) {
          //this emitter is sumanEvents for single process mode
          emitter.emit('vals', {});
        }
        else {
          integrantsEmitter.emit('vals', {});
        }
      });
    }
  }
  else if (_suman.usingRunner) {

    integrantsFn = function () {

      const integrantsFromParentProcess: Array<any> = [];
      const oncePreVals: any = {};

      if (integrantsReady) {
        process.nextTick(function () {
          integrantsEmitter.emit('vals', oncePreVals);
        });
      }
      else {
        let integrantMessage = function (msg: IIntegrantsMessage) {
          if (msg.info === 'integrant-ready') {
            integrantsFromParentProcess.push(msg.data);
            oncePreVals[msg.data] = msg.val;
            if (su.checkForEquality(integrants, integrantsFromParentProcess)) {
              integrantsReady = true;
              if (postOnlyReady !== false) {
                process.removeListener('message', integrantMessage);
                integrantsEmitter.emit('vals', oncePreVals);
              }
            }
          }
          else if (msg.info === 'integrant-error') {
            process.removeListener('message', integrantMessage);
            integrantsEmitter.emit('error', msg);
          }
          else if (msg.info === 'once-post-received') {
            // note: we need to make sure the runner received the "post" requirements of this test
            // before this process exits
            postOnlyReady = true;
            if (integrantsReady !== false) {
              process.removeListener('message', integrantMessage);
              integrantsEmitter.emit('vals', oncePreVals);
            }
          }
        };

        process.on('message', integrantMessage);
        process.send({
          type: constants.runner_message_type.INTEGRANT_INFO,
          msg: integrants,
          oncePost: $oncePost,
          expectedExitCode: _suman.expectedExitCode,
          expectedTimeout: _suman.expectedTimeout
        });
      }
    }
  }
  else {
    integrantsFn = function (emitter: EventEmitter) {

      //TODO: if multiple test files are reference in project and it is run without the runner,
      // we need to check if integrants are already ready

      //declared at top of file
      integPreConfiguration =
        (integPreConfiguration || integrantPreFn({temp: 'we are in suman project => lib/index.js'}));

      const d = domain.create();

      d.once('error', function (err: Error) {

        err = new Error(' => Suman fatal error => there was a problem verifying the ' +
          'integrants listed in test file "' + $module.filename + '"\n' + (err.stack || err));

        fatalRequestReply({
          type: constants.runner_message_type.FATAL,
          data: {
            msg: err,
            stack: err
          }
        }, function () {
          console.error(err.stack || err);
          _suman._writeTestError(err.stack || err);
          process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
        });

      });

      d.run(function () {

        if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {

          acquireIntegrantsSingleProcess(integrants, integPreConfiguration,
            su.onceAsync(null, function (err: Error, vals: Array<any>) {
              d.exit();
              process.nextTick(function () {
                if (err) {
                  emitter.emit('error', err);
                }
                else {
                  emitter.emit('vals', vals);
                }
              });

            }));

        }
        else {

          acquireDeps(integrants, integPreConfiguration,
            su.onceAsync(null, function (err: Error, vals: Array<any>) {

              d.exit();
              process.nextTick(function () {
                if (err) {
                  integrantsEmitter.emit('error', err);
                }
                else {
                  integrantsEmitter.emit('vals', vals);
                }
              });

            }));
        }

      });
    }
  }

  let integrantsInvoked = false;
  init.tooLate = false;

  const start: IStartCreate =
    function (desc: string, opts?: ICreateOpts, arr?: Array<string | TCreateHook>, cb?: TCreateHook) {

      //this call will validate args

      const args = pragmatik.parse(arguments, rules.createSignature);

      if (init.tooLate === true && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
        console.error(' => Suman usage fatal error => You must call Test.describe() synchronously => ' +
          'in other words, all Test.describe() calls should be registered in the same tick of the event loop.');
        return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
      }

      const sumanEvents = Transform();

      sumanEvents.on('test', function () {
        debug('SUMAN EVENTS test!');
        exportEvents.emit.bind(exportEvents, 'test').apply(exportEvents, arguments);
      });
      sumanEvents.on('error', function () {
        debug('SUMAN EVENTS error!');
        exportEvents.emit.bind(exportEvents, 'error').apply(exportEvents, arguments);
      });
      sumanEvents.on('suman-test-file-complete', function () {
        debug('SUMAN EVENTS suman-test-file-complete!');
        exportEvents.emit.bind(exportEvents, 'suman-test-file-complete').apply(exportEvents, arguments);
      });

      process.nextTick(function () {
        init.tooLate = true;
      });

      //counts just for this $module
      exportEvents.counts.sumanCount++;
      //counts for all sumans in this whole Node.js process
      counts.sumanCount++;

      debug(' in index => exportEvents count =>',
        exportEvents.counts.sumanCount, ' => counts.sumanCount => ', counts.sumanCount);

      const to = setTimeout(function () {
        console.error(' => Suman usage error => Integrant acquisition timeout.');
        process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
      }, _suman.weAreDebugging ? 50000000 : 50000);

      function onPreVals(vals: Array<any>) {

        clearTimeout(to);

        if (!inBrowser && !_suman.iocConfiguration || process.env.SUMAN_SINGLE_PROCESS === 'yes') {

          iocData['suman.once.pre.js'] = vals;
          // should copy the data not directly reference it, should be stringifiable/serializable
          _suman.userData = JSON.parse(JSON.stringify(iocData));

          // TODO: perhaps pass suman.once.pre.js data to ioc also
          // Note that since "suman single process" mode processes each file in series,
          // we overwrite the global iocConfiguration var, dangerously

          let iocFnArgs = fnArgs(iocFn);
          let getiocFnDeps = makeIocDepInjections(iocData);
          let iocFnDeps = getiocFnDeps(iocFnArgs);
          _suman.iocConfiguration = iocFn.apply(null, iocFnDeps) || {};
        }
        else {
          _suman.iocConfiguration = _suman.iocConfiguration || {};
        }

        //TODO: need to properly toggle boolean that determines whether or not to try to create dir
        makeSuman($module, _interface, true, sumanConfig, function (err: Error, suman: ISuman) {


          if (err) {
            _suman._writeTestError(err.stack || err);
            return process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
          }

          if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
            if (exportEvents.listenerCount('test') < 1) {
              throw new Error(' => We are in "SUMAN_SINGLE_PROCESS" mode but nobody is listening for test events. ' +
                'To run SUMAN_SINGLE_PROCESS mode you need to use the suman executable, not plain node.');
            }
          }

          suman._sumanModulePath = $module.filename;

          if (exportTests && matches) {

            const $code = constants.EXIT_CODES.EXPORT_TEST_BUT_RAN_TEST_FILE_DIRECTLY;

            const msg = ' => Suman usage error => You have declared export:true in your suman.init call, ' +
              'but ran the test directly.';
            console.error(msg);

            return fatalRequestReply({
              type: constants.runner_message_type.FATAL,
              data: {
                error: msg,
                msg: msg
              }
            }, function () {

              _suman._writeTestError(' => Suman usage error => You have declared export:true in ' +
                'your suman.init call, but ran the test directly.');
              suman.logFinished(null, function () {
                process.exit($code);  //use original code
              });

            });

          }
          else {

            suman._sumanEvents = sumanEvents;
            const run = es.main(suman);

            try {
              process.domain && process.domain.exit();
            }
            catch (err) {
            }

            global.setImmediate(function () {

              // IMPORTANT: setImmediate allows for future possibility of multiple test suites referenced in the same file
              // other async "integrantsFn" probably already does this

              if (exportTests === true) { //TODO: if we use this, need to make work with integrants/blocked etc.

                if (series) {

                  let fn = function () {
                    suman.extraArgs = Array.from(arguments);
                    run.apply(null, args);  //args are most likely (desc,opts,cb)
                  };

                  $module.testSuiteQueue.unshift(fn);

                  sumanEvents.on('suman-test-file-complete', function () {
                    //this code should only be invoked if we are using Test.create's in series
                    testSuiteQueue.pop();

                    let fn: Function;
                    if (fn = testSuiteQueue[testSuiteQueue.length - 1]) {
                      sumanEvents.emit('test', fn);
                    }
                    else {
                      console.error(colors.red.bold(' => Suman implementation error => Should not be empty.'));
                    }

                  });

                  if ($module.testSuiteQueue.length === 1) {
                    sumanEvents.emit('test', fn);
                  }

                }
                else {
                  sumanEvents.emit('test', function () {
                    console.log('ARGUMENTS => ', arguments);
                    suman.extraArgs = Array.from(arguments);
                    run.apply(global, args);
                  });
                }

                if (false && writable) {
                  args.push([]); // [] is empty array representing extra/ $uda
                  args.push(writable); //TODO: writable should be same as sumanEvents (?)
                  // args.push(iocData);
                  // args.push(suman.userData);
                  run.apply(global, args);
                }

              }
              else {

                if (series) {

                  let fn = function () {
                    run.apply(null, args);  //args are most likely (desc,opts,cb)
                  };

                  $module.testSuiteQueue.unshift(fn);

                  if ($module.testSuiteQueue.length === 1) {
                    fn.apply(null, args);  //args are most likely (desc,opts,cb)
                  }

                }
                else {
                  run.apply(null, args);  //args are most likely (desc,opts,cb)
                }

              }
            });
          }

        });

      }

      if (process.env.SUMAN_SINGLE_PROCESS !== 'yes') {

        integrantsEmitter.once('error', function (err: Error) {
          clearTimeout(to);
          console.error(err.stack || err);
          _suman._writeTestError(err.stack || err);
          process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
        });

        integrantsEmitter.once('vals', onPreVals);
      }
      else {
        sumanEvents.once('vals', onPreVals);
      }

      //we run integrants function
      process.nextTick(function () {
        if (!integrantsInvoked || (process.env.SUMAN_SINGLE_PROCESS === 'yes')) {
          //always run this if we are in SUMAN_SINGLE_PROCESS mode.
          integrantsInvoked = true;
          const emitter = (process.env.SUMAN_SINGLE_PROCESS === 'yes' ? sumanEvents : null);
          debug('calling integrants fn');
          integrantsFn(emitter);
        }
        else {
          debug('integrantsInvoked more than once for non-SUMAN_SINGLE_PROCESS mode run',
            'process.env.SUMAN_SINGLE_PROCESS => ' + process.env.SUMAN_SINGLE_PROCESS);
        }
      });

    };

  init.$ingletonian = {
    parent: $module.parent, //parent is who required the original $module
    file: _suman.sumanTestFile = $module.filename
  };

  start.skip = init.$ingletonian.skip = function () {
    const args = pragmatik.parse(arguments, rules.blockSignature);
    args[1].skip = true;
    start.apply(this, args);
  };

  start.only = init.$ingletonian.only = function () {
    const args = pragmatik.parse(arguments, rules.blockSignature);
    _suman.describeOnlyIsTriggered = true;
    args[1].only = true;
    start.apply(this, args);
  };

  start.delay = init.$ingletonian.delay = function () {
    const args = pragmatik.parse(arguments, rules.blockSignature);
    args[1].delay = true;
    start.apply(this, args);
  };

  const create = init.$ingletonian.create = start;
  _interface === 'TDD' ? init.$ingletonian.suite = create : init.$ingletonian.describe = create;
  loaded = true;
  return init.$ingletonian;

};

function Writable(type: any) {

  if (this instanceof Writable) {
    return Writable.apply(global, arguments);
  }

  //type: duplex, transform etc

  const strm = new stream.Writable({
    write: function (chunk: any, encoding: string, cb: Function) {
      console.log('index chunks:', String(chunk));
    }
  });
  strm.cork();

  return strm;

}

//TODO: https://gist.github.com/PaulMougel/7961469

function Transform(): BufferStream {

  //TODO: http://stackoverflow.com/questions/10355856/how-to-append-binary-data-to-a-buffer-in-node-js

  // const strm = new stream.Transform({
  //
  //     transform: function (chunk, encoding, cb) {
  //
  //         let data = chunk.toString();
  //         if (this._lastLineData) {
  //             data = this._lastLineData + data;
  //         }
  //
  //         console.log('data:', data);
  //
  //         let lines = data.split('\n');
  //         this._lastLineData = lines.splice(lines.length - 1, 1)[0];
  //
  //         lines.forEach(this.push.bind(this));
  //         cb();
  //     }
  // });

  let BufferStream = function () {
    stream.Transform.apply(this, arguments);
    this.buffer = [];
  };

  util.inherits(BufferStream, stream.Transform);

  BufferStream.prototype._transform = function (chunk: string, encoding: string, done: Function) {
    // custom buffering logic
    // ie. add chunk to this.buffer, check buffer size, etc.

    this.push(chunk ? String(chunk) : null);
    this.buffer.push(chunk ? String(chunk) : null);

    done();
  };

  BufferStream.prototype.pipe = function (destination: Stream, options: Object) {
    let res = stream.Transform.prototype.pipe.apply(this, arguments);
    this.buffer.forEach(function (b: string) {
      res.write(String(b));
    });
    return res;
  };

  // strm.cork();
  return new BufferStream();

}

function autoPass() {
  // add t.skip() type functionality // t.ignore().
  console.log(' => Suman auto pass function passthrough recorded, this is a no-op.');
}

function autoFail() {
  throw new Error('Suman auto-fail. Perhaps flesh-out this hook or test to get it passing.');
}

function once(fn: Function) {

  let cache: any = null;

  return function (cb: Function) {

    if (cache) {
      process.nextTick(function () {
        cb.call(null, null, cache);
      });
    }
    else {
      fn.call(null, function (err: Error, val: any) {
        if (!err) {
          cache = val || {
              'Suman says': 'This is a dummy-cache val. ' +
              'See => sumanjs.github.io/tricks-and-tips.html'
            };
        }
        cb.apply(null, arguments);
      });
    }
  }
}

function load(opts: suman.ILoadOpts) {

  if (typeof opts !== 'object') {
    throw new Error(' => Suman usage error => Please pass in an options object to the suman.load() function.')
  }

  const pth = opts.path;
  const indirect = !!opts.indirect;

  assert(path.isAbsolute(pth), ' => Suman usage error => Please pass in an absolute path to suman.load() function.');
  // ughhh, not pretty, have to use this methodology to tell Suman to "export" tests
  _suman._sumanIndirect = indirect;
  const exp = require(pth);
  _suman._sumanIndirect = null;
  return exp;
}


const suman: suman.IInitExport = {
  load,
  autoPass,
  autoFail,
  init,
  constants,
  Writable,
  Transform,
  once
};

try {
  window.suman = suman;
  console.log(' => "suman" is now available as a global variable in the browser.');
}
catch (err) {
}


export = suman;
