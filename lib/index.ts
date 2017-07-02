'use strict';

// typescript imports
import {IGlobalSumanObj, ISumanConfig, SumanErrorRace} from "../dts/global";
import EventEmitter = NodeJS.EventEmitter;
import {ISuman} from "../dts/suman";
import {Stream, Transform, Writable} from "stream";
import {IDescribeFn, IDescribeOpts, TDescribeHook} from "../dts/describe";
import {IIntegrantsMessage, ISumanModuleExtended, TCreateHook} from "../dts/index-init";
import {IHookOrTestCaseParam} from "../dts/test-suite";
export type TConfigOverride = Partial<ISumanConfig>;

// exported imports
export {ITestCaseParam} from '../dts/test-suite';
export {IHookParam} from '../dts/test-suite';
export {IDescribeFn} from '../dts/describe';
export {ItFn} from '../dts/it';
export {IBeforeFn} from '../dts/before';
export {IBeforeEachFn} from '../dts/before-each';
export {IAfterFn} from '../dts/after';
export {IAfterEachFn} from '../dts/after-each';

export interface ISumanErrorFirstCB {
  (err: Error | undefined | null, ...args: any[]): void
}

// exported declarations
export interface ILoadOpts {
  path: string,
  indirect: boolean
}

export interface Ioc {
  a: string,
  b: string
}

export interface  IIoCData {
  $pre?: Object,
  [key: string]: any
}

export interface IInitOpts {
  export?: boolean,
  __expectedExitCode?: number,
  pre?: Array<string>,
  integrants?: Array<string>,
  series?: boolean,
  writable?: EventEmitter,
  timeout?: number,
  post?: Array<any>,
  interface?: string,
  iocData?: IIoCData,
  ioc?: Object
}

export interface IStartCreate {
  //desc: string, opts?: ICreateOpts, arr?: Array<string | TCreateHook>, cb?: TCreateHook
  (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TCreateHook): void,
  delay?: IDescribeFn,
  skip?: IDescribeFn,
  only?: IDescribeFn
}

export interface IInit {
  (module: ISumanModuleExtended, opts?: IInitOpts, confOverride?: TConfigOverride): IStartCreate,
  $ingletonian?: any,
  tooLate?: boolean
}

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as util from 'util';
import * as assert from 'assert';
import * as path from 'path';
import * as EE from 'events';
import * as fs from 'fs';
import * as stream from 'stream';

// npm
import * as chalk from 'chalk';
const pragmatik = require('pragmatik');
const debug = require('suman-debug')('s:index');

//project
let inBrowser = false;
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
_suman.dateEverythingStarted = Date.now();
require('./helpers/add-suman-global-properties');
require('./patches/all');

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

if (_suman.sumanOpts) {
  if (_suman.sumanOpts.verbosity > 8) {
    console.log(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
  }
}
else {
  _suman.logWarning('sumanOpts is not yet defined in runtime.');
}

const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
const {fatalRequestReply} = require('./helpers/fatal-request-reply');
const async = require('async');

// export
const {constants} = require('../config/suman-constants');
const IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';

////////////////////////////////////////////////////////////////////

require('./index-helpers/exit-handling');

/////////////////////////////////////////////////////////////////////

// project
import handleIntegrants from './index-helpers/handle-integrants';
import setupExtraLoggers from './index-helpers/setup-extra-loggers';
const rules = require('./helpers/handle-varargs');
import {makeSuman} from './suman';
const su = require('suman-utils');
const {execSuite} = require('./exec-suite');
const fnArgs = require('function-arguments');
import makeIocDepInjections from './injection/ioc-injector';
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';

///////////////////////////////////////////////////////////////////////////////////////////

//integrants
const allOncePreKeys: Array<Array<string>> = _suman.oncePreKeys = [];
const allOncePostKeys: Array<Array<string>> = _suman.oncePostKeys = [];
const integrantsEmitter = _suman.integrantsEmitter = (_suman.integrantsEmitter || new EE());
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());

////////////////////////////////////////////////////////////////////////////////////////////

require('./helpers/handle-suman-counts');
require('./index-helpers/verify-local-global-version');
const counts = require('./helpers/suman-counts');
const projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd()) || '/';

// here comes the hotstepper
// cache these values for purposes of SUMAN_SINGLE_PROCESS option

const main = require.main.filename;
const usingRunner = _suman.usingRunner = (_suman.usingRunner || process.env.SUMAN_RUNNER === 'yes');

//could potentially pass dynamic path to suman config here, but for now is static
const sumanConfig = require('./helpers/load-suman-config')(null);

if (!_suman.usingRunner && !_suman.viaSuman) {
  require('./helpers/print-version-info'); // just want to run this once
}

const sumanPaths = require('./helpers/resolve-shared-dirs')(sumanConfig, projectRoot, sumanOpts);
const sumanObj = require('./helpers/load-shared-objects')(sumanPaths, projectRoot, sumanOpts);

const {integrantPreFn, iocFn} = sumanObj;
const testDebugLogPath = sumanPaths.testDebugLogPath;
const testLogPath = sumanPaths.testLogPath;

fs.writeFileSync(testDebugLogPath, '\n', {flag: 'w'});
fs.writeFileSync(testLogPath, '\n => New Suman run @' + new Date(), {flag: 'w'});

////////////////////////////////////////////////////////////////////////////////

let loaded = false;
let moduleCount = 0;

export const init: IInit = function ($module, $opts, confOverride): IStartCreate {

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

  ///////////////////////////////////////////////////////

  if (init.$ingletonian) {
    if (!SUMAN_SINGLE_PROCESS) {
      console.error(chalk.red(' => Suman usage warning => suman.init() only needs to be called once per test file.'));
      return init.$ingletonian;
    }
  }

  if (this instanceof init) {
    console.error('\n', ' => Suman usage warning: no need to use "new" keyword with the suman.init()' +
      ' function as it is not a standard constructor');
    return init.apply(null, arguments);
  }

  require('./handle-exit'); // handle exit here
  require('./helpers/load-reporters-last-ditch');

  const {sumanOpts} = _suman;

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
    assert(su.isObject(confOverride), ' => Suman conf override value must be defined and an object => {}.');
    Object.assign(_suman.sumanConfig, confOverride);
  }

  _suman.sumanInitCalled = true;
  _suman.sumanInitStartDate = (_suman.sumanInitStartDate || Date.now());
  _suman._currentModule = $module.filename;
  _suman.SUMAN_TEST = 'yes';

  // TODO: could potention figure out what original test module is via suman.init call, instead of
  // requiring that user pass it explicitly

  if (!loaded) {

    //note that these calls need to be inside suman.init() so they don't get loaded by the runner, etc.
    //although perhaps we should put the runner code elsewhere, because user does not need to call runner
    //look through version control from Sunday Nov 20th for this code
  }

  if ($opts) {
    assert(su.isObject($opts), 'Please pass an options object as a second argument to suman.init()');
  }

  let matches = false;
  if (usingRunner) { //when using runner cwd is set to project root or test file path
    if (process.env.SUMAN_CHILD_TEST_PATH === $module.filename) {
      matches = true;
    }
  }
  else {  //if we run
    if (sumanOpts.verbosity > 7) {
      console.log(' => Suman verbose message => require.main.filename value:', main);
    }
    if (main === $module.filename) {
      matches = true;
    }
  }

  const opts: IInitOpts = $opts || {};

  const series = !!opts.series;
  const writable = opts.writable;

  if ($module._sumanInitted) {
    console.error(' => Suman warning => suman.init() already called for ' +
      'this module with filename => ', $module.filename);
    return;
  }

  $module._sumanInitted = true;
  moduleCount++;

  const testSuiteQueue: Array<Function> = $module.testSuiteQueue = [];

  // in SUMAN_SINGLE_PROCESS mode, this might get registered multiple times...
  suiteResultEmitter.on('suman-completed', function () {

    // we set this to null because no suman should be in progress
    _suman.whichSuman = null;

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

  const exportEvents: EventEmitter = $module.exports = (writable || SumanTransform());

  exportEvents.counts = {
    sumanCount: 0
  };

  Object.defineProperty($module, 'exports', {
    //freeze module exports to avoid horrible bugs
    writable: false
  });

  let integrants: Array<string>;

  try {
    integrants = (opts.integrants || opts.pre || []).filter(function (item) {
      assert(typeof item === 'string', `once.pre item must be a string. Instead we have => ${util.inspect(item)}`);
      // filter out empty strings, etc.
      return item;
    });
  }
  catch (err) {
    _suman.logError('"integrants/pre" option must be an array type.');
    throw err;
  }

  // remove falsy elements, for user convenience
  integrants = integrants.filter((i: any) => i);

  if (opts.__expectedExitCode !== undefined && !SUMAN_SINGLE_PROCESS) {
    let expectedExitCode = _suman.expectedExitCode = _suman.expectedExitCode || opts.__expectedExitCode;
    assert(Number.isInteger(expectedExitCode) && expectedExitCode > -1, ' => Suman usage error => Expected exit ' +
      'code not an positive/acceptable integer.');
  }

  if (opts.timeout !== undefined && !SUMAN_SINGLE_PROCESS) {
    const timeout = _suman.expectedTimeout = opts.timeout;
    assert(Number.isInteger(timeout) && timeout > 0, ' => Suman usage error => Expected timeout value ' +
      'is not an acceptable integer.');

    setTimeout(function () {
      console.log('\n', new Error('=> Suman test file has timed out -' +
        ' "timeout" value passed to suman.init() has been reached exiting....').stack);
      process.exit(constants.EXIT_CODES.TEST_FILE_TIMEOUT);
    }, timeout);

  }

  let $oncePost: Array<string>;

  try {
    $oncePost = (opts.post || []).filter(function (item) {
      assert(typeof item === 'string', `once.post key must be a string. Instead we have => ${util.inspect(item)}`);
      // filter out empty strings, etc.
      return item;
    });
  }
  catch (err) {
    _suman.logError('"post" option must be an array type.');
    throw err;
  }

  //pass oncePost so that we can use it later when we need to
  allOncePostKeys.push($oncePost);
  allOncePreKeys.push(integrants);

  const _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const exportTests = (opts.export === true || SUMAN_SINGLE_PROCESS || _suman._sumanIndirect);
  const iocData: IIoCData = opts.iocData || opts.ioc || {};

  if (iocData) {
    try {
      assert(typeof iocData === 'object' && !Array.isArray(iocData),
        chalk.red(' => Suman usage error => "ioc" property passed to suman.init() needs ' +
          'to point to an object'));
    }
    catch (err) {
      console.log(err.stack);
      process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
    }
  }

  if (exportTests) {
    //TODO: if export is set to true, then we need to exit if we are using the runner
    if (su.isSumanDebug() || sumanOpts.verbosity > 7) {
      console.log(chalk.magenta(' => Suman message => export option set to true.'));
    }
  }

  //////////////////////////////////////////////////////////////////

  setupExtraLoggers(usingRunner, testDebugLogPath, testLogPath, $module);

  const integrantsFn = handleIntegrants(integrants, $oncePost, integrantPreFn, $module);
  let integrantsInvoked = false;
  init.tooLate = false;

  const start: IStartCreate = function (desc, opts, arr, cb) {

    //this call will validate args
    const args = pragmatik.parse(arguments, rules.createSignature);
    args[1].__preParsed = true;

    if (init.tooLate === true && !SUMAN_SINGLE_PROCESS) {
      console.error(' => Suman usage fatal error => You must call Test.describe() synchronously => ' +
        'in other words, all Test.describe() calls should be registered in the same tick of the event loop.');
      return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
    }

    const sumanEvents = SumanTransform();

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

    const to = setTimeout(function () {
      console.error(' => Suman usage error => Integrant acquisition timeout.');
      process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
    }, _suman.weAreDebugging ? 50000000 : 500000);

    function onPreVals(vals: Array<any>) {

      clearTimeout(to);
      _suman['$pre'] = JSON.parse(JSON.stringify(vals));
      _suman.userData = JSON.parse(JSON.stringify(iocData));

      if (!inBrowser && !_suman.iocConfiguration) {
        let iocFnArgs = fnArgs(iocFn);
        let getiocFnDeps = makeIocDepInjections(iocData);
        let iocFnDeps = getiocFnDeps(iocFnArgs);
        let iocRet = iocFn.apply(null, iocFnDeps);
        assert(su.isObject(iocRet.dependencies),
          ' => suman.ioc.js must export a function which returns an object with a dependencies property.');
        _suman.iocConfiguration = iocRet.dependencies;
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

        if (SUMAN_SINGLE_PROCESS) {
          if (exportEvents.listenerCount('test') < 1) {
            throw new Error(' => We are in "SUMAN_SINGLE_PROCESS" mode but nobody is listening for test events.\n' +
              'To run SUMAN_SINGLE_PROCESS mode you need to use the suman executable, not plain node.');
          }
        }


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
          const run = execSuite(suman);

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
                    console.error(chalk.red.bold(' => Suman implementation error => Should not be empty.'));
                  }

                });

                if ($module.testSuiteQueue.length === 1) {
                  sumanEvents.emit('test', fn);
                }

              }
              else {
                sumanEvents.emit('test', function () {
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

    if (SUMAN_SINGLE_PROCESS) {
      sumanEvents.once('vals', onPreVals);
    }
    else {

      integrantsEmitter.once('error', function (err: Error) {
        clearTimeout(to);
        console.error(err.stack || err);
        _suman._writeTestError(err.stack || err);
        process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
      });

      integrantsEmitter.once('vals', onPreVals);
    }

    //we run integrants function
    process.nextTick(function () {
      if (!integrantsInvoked || SUMAN_SINGLE_PROCESS) {
        //always run this if we are in SUMAN_SINGLE_PROCESS mode.
        integrantsInvoked = true;
        const emitter = SUMAN_SINGLE_PROCESS ? sumanEvents : null;
        integrantsFn(emitter);
      }
      else {
        _suman.logWarning('integrantsInvoked more than once for non-SUMAN_SINGLE_PROCESS mode run',
          'process.env.SUMAN_SINGLE_PROCESS => ' + process.env.SUMAN_SINGLE_PROCESS);
      }
    });

  };

  init.$ingletonian = {
    parent: $module.parent, //parent is who required the original $module
    file: _suman.sumanTestFile = $module.filename
  };

  start.skip = init.$ingletonian.skip = function () {
    const args = pragmatik.parse(arguments, rules.createSignature);
    args[1].skip = true;
    start.apply(this, args);
  };

  start.only = init.$ingletonian.only = function () {
    const args = pragmatik.parse(arguments, rules.createSignature);
    _suman.describeOnlyIsTriggered = true;
    args[1].only = true;
    start.apply(this, args);
  };

  start.delay = init.$ingletonian.delay = function () {
    const args = pragmatik.parse(arguments, rules.createSignature);
    args[1].delay = true;
    start.apply(this, args);
  };

  const create = init.$ingletonian.create = start;
  _interface === 'TDD' ? init.$ingletonian.suite = create : init.$ingletonian.describe = create;
  loaded = true;
  return init.$ingletonian;

};

export function SumanWritable(type: any): Writable {

  if (this instanceof SumanWritable) {
    return SumanWritable.apply(global, arguments);
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

export function SumanTransform(): Transform {

  if (this instanceof SumanTransform) {
    return SumanTransform.apply(global, arguments);
  }

  //TODO: http://stackoverflow.com/questions/10355856/how-to-append-binary-data-to-a-buffer-in-node-js

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

export const autoPass = function (t: IHookOrTestCaseParam) {
  // add t.skip() type functionality // t.ignore().
  if (t.callbackMode) {
    t.done();
  }
};

export const autoFail = function (t: IHookOrTestCaseParam) {
  let err = new Error('Suman auto-fail. Perhaps flesh-out this hook or test to get it passing.');
  if (t.callbackMode) {
    t.done(err)
  }
  else {
    return Promise.reject(err);
  }
};

export const once = function (fn: Function) {

  let cache: any = null;

  return function (cb: Function) {

    if (cache) {
      process.nextTick(cb, null, cache);
    }
    else {
      fn.call(null, function (err: Error, val: any) {
        if (!err) {
          cache = val || {
              'Suman says': 'This is a dummy-cache val. ' +
              'See => sumanjs.org/tricks-and-tips.html'
            };
        }
        cb.apply(null, arguments);
      });
    }
  }
};

export const load = function (opts: ILoadOpts) {

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
};

try {
  window.suman = module.exports;
  console.log(' => "suman" is now available as a global variable in the browser.');
}
catch (err) {
}

const $exports = module.exports;
export default $exports;
