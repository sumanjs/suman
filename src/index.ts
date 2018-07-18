'use strict';


//dts
import {IGlobalSumanObj, ISumanConfig, SumanErrorRace, ISumanOpts} from "suman-types/dts/global";
import EventEmitter = NodeJS.EventEmitter;
import {IStartCreate, IIoCData, IInitFn, IInitOpts} from "suman-types/dts/index-init"
import {Stream, Transform, Writable} from "stream";
import {IIntegrantsMessage, ISumanModuleExtended, TCreateHook, IInitRet} from "suman-types/dts/index-init";
import {IHookOrTestCaseParam} from "suman-types/dts/params";
import {DefineObject, DefineObjectContext} from "./test-suite-helpers/define-options-classes";

//exported imports
import * as s from './s'
export {s};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

if (process.env.IS_SUMAN_BROWSER_TEST === 'yes') {
  throw new Error('This file should not be loaded if the process.env.IS_SUMAN_BROWSER_TEST var is set to "yes".');
}

//core
import util = require('util');
import assert = require('assert');
import path = require('path');
import EE = require('events');
import fs = require('fs');
import stream = require('stream');

// npm
import chalk from 'chalk';
import su = require('suman-utils');
import async = require('async');
const pragmatik = require('pragmatik');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
let inBrowser = false, usingKarma = false;
import sumanRun = require('./helpers/suman-run');

_suman.dateEverythingStarted = Date.now();
require('./helpers/add-suman-global-properties');
require('./patches/all');
import {getClient} from './index-helpers/socketio-child-client'; // just for pre-loading
const sumanOptsFromRunner = _suman.sumanOpts || (process.env.SUMAN_OPTS ? JSON.parse(process.env.SUMAN_OPTS) : {});
const sumanOpts = _suman.sumanOpts = (_suman.sumanOpts || sumanOptsFromRunner);

if (process.argv.indexOf('-f') > 0) {
  // here we allow --force option to work with plain node executable
  sumanOpts.force = true;
}
else if (process.argv.indexOf('--force') > 0) {
  // here we allow --force option to work with plain node executable
  sumanOpts.force = true;
}

process.on('error', function (e: Error) {
  debugger; // please leave it here, thx
  _suman.log.error(su.getCleanErrorString(e));
});

try {
  if (window) {
    sumanOpts.series = true;
    fs = require('suman-browser-polyfills/modules/fs');
  }
}
catch (err) {

}

try {
  window.onerror = function (e) {
    console.error('window onerror event', e);
  };
  window.suman = module.exports;
  console.log(' => "suman" is now available as a global variable in the browser.');
  inBrowser = _suman.inBrowser = true;
  if (window.__karma__) {
    usingKarma = _suman.usingKarma = true;
    _suman.sumanOpts && (_suman.sumanOpts.force = true);
  }
}
catch (err) {
  inBrowser = _suman.inBrowser = false;
}

if (!_suman.sumanOpts) {
  _suman.log.warning('implementation warning: sumanOpts is not yet defined in runtime.');
}

if (_suman.sumanOpts && _suman.sumanOpts.verbosity > 8) {
  _suman.log.info(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
}

////////////////////////////////////////////////////////////////////

require('./index-helpers/exit-handling');

/////////////////////////////////////////////////////////////////////

// project
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
import {fatalRequestReply} from './helpers/general';

import {constants} from './config/suman-constants';
import {handleIntegrants} from './index-helpers/handle-integrants';
import rules = require('./helpers/handle-varargs');
import {makeSuman} from './suman';
import {execSuite} from './exec-suite';
import {loadSumanConfig, resolveSharedDirs, loadSharedObjects} from './helpers/general';
import {acquireIocStaticDeps} from './acquire-dependencies/acquire-ioc-static-deps';
import {shutdownProcess, handleSingleFileShutdown} from "./helpers/handle-suman-shutdown";
import {ISumanRunFn} from "./helpers/suman-run";

const allOncePreKeys: Array<Array<string>> = _suman.oncePreKeys = [];
const allOncePostKeys: Array<Array<string>> = _suman.oncePostKeys = [];
const suiteResultEmitter = _suman.suiteResultEmitter = _suman.suiteResultEmitter || new EE();
const initMap = new Map() as Map<Object, Object>;

////////////////////////////////////////////////////////////////////////////////////////////

if (!SUMAN_SINGLE_PROCESS && !inBrowser) {
  // if not a single process, then we shutdown after the first test file completes
  handleSingleFileShutdown();
}

require('./index-helpers/verify-local-global-version');

let projectRoot: string,
  loaded = false,
  sumanConfig: ISumanConfig,
  main: string,
  usingRunner: boolean,
  testDebugLogPath: string,
  sumanPaths: Array<string>,
  sumanObj: Object,
  integrantPreFn: Function;

////////////////////////////////////////////////////////////////////////////////

const testSuiteQueueCallbacks: Array<Function> = [];
const testRuns: Array<Function> = [];
const testSuiteRegistrationQueueCallbacks: Array<Function> = [];
const c = (sumanOpts && sumanOpts.series) ? 1 : 3;

const testSuiteQueue = _suman.tsq = async.queue(function (task: Function, cb: Function) {
  testSuiteQueueCallbacks.unshift(cb);
  process.nextTick(task);
}, c);

const testSuiteRegistrationQueue = _suman.tsrq = async.queue(function (task: Function, cb: Function) {
  // important! => Test.creates need to be registered only one at a time
  testSuiteRegistrationQueueCallbacks.unshift(cb);
  process.nextTick(task);
}, c);

testSuiteRegistrationQueue.drain = function () {
  if (su.vgt(5)) {
    const suites = testRuns.length === 1 ? 'suite' : 'suites';
    _suman.log.info(`Pushing ${testRuns.length} test ${suites} onto queue with concurrency ${c}.\n\n`);
  }
  
  while (testRuns.length > 0) {  //explicit for your pleasure
    testSuiteQueue.push(testRuns.shift());
  }
};

testSuiteQueue.drain = function () {
  suiteResultEmitter.emit('suman-test-file-complete');
  if (inBrowser && testSuiteRegistrationQueue.idle()) {
    shutdownProcess();
  }
};

suiteResultEmitter.on('suman-test-registered', function (fn: Function) {
  testRuns.push(fn);
  process.nextTick(function () {
    let fn = testSuiteRegistrationQueueCallbacks.pop();
    fn && fn.call(null);
  });
});

suiteResultEmitter.on('suman-completed', function () {
  // we set this to null because no suman should be in progress
  process.nextTick(function () {
    let fn = testSuiteQueueCallbacks.pop();
    fn && fn.call(null);
  });
});

_suman.writeTestError = function (data: string, ignore: boolean) {
  if (IS_SUMAN_DEBUG && !_suman.usingRunner) {
    if (!ignore) _suman.checkTestErrorLog = true;
    if (!data) data = new Error('falsy data passed to writeTestError').stack;
    if (typeof data !== 'string') data = util.inspect(data);
    fs.appendFileSync(testDebugLogPath, data);
  }
};

if (inBrowser) {
  if (!window.__karma__) {
    const client = getClient();
    testSuiteRegistrationQueue.pause();
    setImmediate(function () {
      require('./handle-browser').run(testSuiteRegistrationQueue, testSuiteQueue, client);
    });
  }
}

export const init: IInitFn = function ($module, $opts, sumanOptsOverride, confOverride) {
  
  ////////////////////////////////////////////////////////////////////////////
  debugger;  // leave this here forever for debugging child processes, etc
  ////////////////////////////////////////////////////////////////////////////
  
  require('./handle-exit');
  
  if (this instanceof init) {
    throw new Error('no need to use "new" keyword with the suman.init() function as it is not a constructor.');
  }
  
  if (initMap.size > 0 && !SUMAN_SINGLE_PROCESS) {
    _suman.log.error(chalk.red('Suman usage warning => suman.init() only needs to be called once per test script.'));
  }
  
  if (!$module) {
    throw new Error('please pass a module instance to suman.init(), e.g., suman.init(module).')
  }
  
  if (initMap.get($module)) {
    return initMap.get($module) as any;
  }
  
  if ($module.sumanInitted) {
    throw new Error(`suman.init() already called for this module with filename => ${$module.filename}`);
  }
  
  $module.sumanInitted = true;
  
  if (typeof _suman.sumanConfig === 'string') {
    _suman.sumanConfig = JSON.parse(_suman.sumanConfig);
  }
  
  if (typeof _suman.sumanOpts === 'string') {
    _suman.log.info('Parsing global suman-options.');
    _suman.sumanOpts = JSON.parse(_suman.sumanOpts);
    _suman.sumanOpts.series = true;
    _suman.sumanOpts.force = true;
  }
  
  if (!$module.filename) {
    _suman.log.warning(`warning: module instance did not have a 'filename' property.`);
    $module.filename = '/';
  }
  
  if (!$module.exports) {
    _suman.log.warning(`warning: module instance did not have an 'exports' property.`);
    $module.exports = {};
  }
  
  if (!loaded) {
    _suman.sumanInitCalled = true;
    require('./helpers/load-reporters-last-ditch').run();
    projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd()) || '/';
    main = require.main.filename;
    usingRunner = _suman.usingRunner = _suman.usingRunner || process.env.SUMAN_RUNNER === 'yes';
    //could potentially pass dynamic path to suman config here, but for now is static
    sumanConfig = loadSumanConfig(null, null);
    if (!_suman.usingRunner && !_suman.viaSuman) {
      require('./helpers/print-version-info'); // just want to run this once
    }
    sumanPaths = resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
    sumanObj = loadSharedObjects(sumanPaths, projectRoot, sumanOpts);
    integrantPreFn = sumanObj.integrantPreFn;
    testDebugLogPath = sumanPaths.testDebugLogPath;
    fs.writeFileSync(testDebugLogPath, '\n');
    fs.appendFileSync(testDebugLogPath, '\n\n', {encoding: 'utf8'});
    _suman.writeTestError('\n ### Suman start run @' + new Date() + ' ###\n', true);
    _suman.writeTestError('\nCommand => ' + util.inspect(process.argv), true);
    
  }
  
  if (!inBrowser) {
    assert(($module.constructor && $module.constructor.name === 'Module'),
      'Please pass the test file module instance as the first argument to suman.init()');
  }
  
  let _sumanConfig = _suman.sumanConfig, _sumanOpts = _suman.sumanOpts;
  
  if (sumanOptsOverride) {
    assert(su.isObject(sumanOptsOverride), 'Suman opts override value must be a plain object.');
    
    Object.keys(sumanOptsOverride).forEach(function (k) {
      if (String(k).trim().startsWith('$')) {
        throw new Error('Suman options override object key must not start with "$" character.');
      }
      _sumanOpts['$' + String(k).trim()] = sumanOptsOverride[k];
    });
    
    // this is correct, although it seems wrong given that sumanOpts is referenced twice
    // we need to keep the reference to _suman.sumanOpts, instead of reassigning
    // _sumanOpts = Object.assign(_suman.sumanOpts, sumanOptsOverride, _suman.sumanOpts);
    // _sumanOpts = Object.assign(_suman.sumanOpts, sumanOptsOverride);
  }
  
  if (confOverride) {
    assert(su.isObject(confOverride), 'Suman config override value must be a plain object.');
    _sumanConfig = Object.assign({}, _suman.sumanConfig, confOverride);
  }
  
  _suman.sumanInitStartDate = _suman.sumanInitStartDate || Date.now();
  
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
  
  const opts: IInitOpts = $opts || {};
  
  if (opts.override) {
    if (opts.override.config) {
      assert(su.isObject(opts.override.config), 'config override value must be a plain object.');
      _sumanConfig = Object.assign({}, _suman.sumanConfig, opts.override.config);
    }
    if (opts.override.opts && opts.override.options) {
      throw new Error('please use either "override.options" or "override.opts", not both.');
    }
    const zopts = opts.override.opts || opts.override.options;
    if (zopts) {
      assert(su.isObject(zopts), 'opts override value must be a plain object.');
      Object.keys(zopts).forEach(function (k) {
        if (String(k).trim().startsWith('$')) {
          throw new Error('Suman options override object key must not start with "$" character.');
        }
        _sumanOpts['$' + String(k).trim()] = zopts[k];
      });
    }
  }
  
  opts.integrants && assert(Array.isArray(opts.integrants), `'integrants' option must be an array.`);
  opts.pre && assert(Array.isArray(opts.pre), `'pre' option must be an array.`);
  
  let $integrants = (opts.integrants || opts.pre || []).filter(i => i).map(function (item) {
    assert(typeof item === 'string', `once.pre item must be a string. Instead we have => ${util.inspect(item)}`);
    // filter out empty strings, etc.
    return item;
  });
  
  // remove falsy elements, for user convenience
  const integrants = $integrants.filter((i: string) => i);
  
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
  
  opts.post && assert(Array.isArray(opts.post), `'post' option must be an array.`);
  let $oncePost = (opts.post || []).filter(function (item) {
    assert(typeof item === 'string', `once.post key must be a string. Instead we have => ${util.inspect(item)}`);
    // filter out empty strings, etc.
    return item;
  });
  
  //pass oncePost so that we can use it later when we need to
  allOncePostKeys.push($oncePost);
  allOncePreKeys.push(integrants);
  
  const iocData: IIoCData = opts.iocData || opts.ioc || {};
  
  if (iocData) {
    try {
      assert(typeof iocData === 'object' && !Array.isArray(iocData),
        chalk.red(' => Suman usage error => "ioc" property passed to suman.init() needs ' +
          'to point to an object'));
    }
    catch (err) {
      _suman.log.error(err.stack || err);
      process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
    }
  }
  
  //////////////////////////////////////////////////////////////////
  
  const integrantsFn = handleIntegrants(integrants, $oncePost, integrantPreFn, $module);
  
  const start: IStartCreate = function ($$desc, $$opts, /* signature is likely args: desc, opts, arr, cb */) {
    
    const isPreParsed = $$opts && $$opts.__preParsed;
    const args = pragmatik.parse(arguments, rules.createSignature, isPreParsed);
    
    args[1].__preParsed = true;
    
    if (start.tooLate === true) {
      console.error(' => Suman usage fatal error => You must call Test.create() synchronously => \n\t' +
        'in other words, all Test.create() calls should be registered in the same tick of the event loop.');
      return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
    }
    
    process.nextTick(function () {
      start.tooLate = true;
    });
    
    const to = setTimeout(function () {
      console.error('Suman usage error => Integrant acquisition timeout.');
      process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
    }, _suman.weAreDebugging ? 50000000 : 50000);
    
    let onPreVals = function (vals: Array<any>) {
      
      clearTimeout(to);
      _suman['$pre'] = JSON.parse(su.customStringify(vals));
      _suman.userData = JSON.parse(su.customStringify(iocData));
      
      // suman instances are the main object that flows through entire program
      let suman = makeSuman($module, opts, _sumanOpts, _sumanConfig);
      suman.iocData = JSON.parse(su.customStringify(iocData));
      const run = execSuite(suman);
      
      try {
        process.domain && process.domain.exit();
      }
      finally {
        global.setImmediate(function () {
          // IMPORTANT: setImmediate guarantees registry of multiple test suites referenced in the same file
          testSuiteRegistrationQueue.push(function () {
            //args are most likely (desc, opts, cb)
            run.apply(null, args);
          });
        });
      }
    };
    
    //we run integrants function
    acquireIocStaticDeps()
    .catch(function (err) {
      clearTimeout(to);
      _suman.log.error(err.stack || err);
      _suman.writeTestError(err.stack || err);
      process.exit(constants.EXIT_CODES.IOC_STATIC_ACQUISITION_ERROR);
    })
    .then(function () {
      return integrantsFn();
    })
    .catch(function (err: Error) {
      clearTimeout(to);
      _suman.log.error(err.stack || err);
      _suman.writeTestError(err.stack || err);
      process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
    })
    .then(onPreVals)
    .catch(function (err: Error) {
      clearTimeout(to);
      _suman.log.error(err.stack || err);
      _suman.writeTestError(err.stack || err);
      process.exit(constants.EXIT_CODES.PRE_VALS_ERROR);
    });
    
    // if start/create is attached to options obj
    return this;
  };
  
  const ret = <IInitRet> {
    parent: $module.parent ? $module.parent.filename : null, //parent is who required the original $module
    file: $module.filename,
    create: start,
    define: function (desc, f) {
      
      if (typeof desc === 'function') {
        f = desc;
        desc = null;
      }
      
      const defObj = new DefineObjectContext(desc as string, start);
      
      if (f) {
        assert(typeof f === 'function', 'Optional argument to define() was expected to be a function.');
        f.call(null, defObj);
      }
      
      return defObj;
    }
  };
  
  initMap.set($module, ret);
  loaded = true;
  return ret.Test = ret;
  
};

export const autoPass = function (t: IHookOrTestCaseParam) {
  // add t.skip() type functionality // t.ignore().
  _suman.log.warning(`test with description ${t.desc} has automatically passed.`);
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

export const isolated = function (fn: Function) {
  
  if (typeof fn !== 'function') {
    throw new Error('Looks like you did not pass a function to the isolated helper.');
  }
  
  const str = String(fn).trim();
  
  if (str.indexOf('async') === 0) {
    throw new Error('Cannot use async functions for isolated scopes.');
  }
  
  if (str.indexOf('function') !== 0 && !/=>\s*{/.test(str)) {
    throw new Error('Cannot use functions without outer braces.');
  }
  
  let first = str.indexOf('{') + 1;
  let last = str.lastIndexOf('}');
  const body = str.substr(first, last - first);
  const paramNames = su.getArgumentNames(str);
  return new Function(...paramNames.concat(body));
};

export const run = sumanRun.run();
export const once = su.onceWithCache;
export const version = require('../package.json').version;

/////////////////////////////////////////////////////////////////

export interface ISumanExports {
  s: typeof s,
  init: IInitFn,
  run: ISumanRunFn,
  autoPass: typeof autoPass,
  autoFail: typeof autoFail
}

export const r2gSmokeTest = function () {
  return true;
};

const $exports = module.exports;
export default $exports as  ISumanExports;

////////////////////////////////////////////////////////////////////////
