'use strict';

if (require.main === module) {
  throw new Error('=> Suman usage error => This file is not meant to be executed directly.');
}

const sumanRuntimeErrors = global.sumanRuntimeErrors = global.sumanRuntimeErrors || [];

function sendFatalMessageToRunner (msg) {
  if (global.usingRunner) {
    //TODO: this is not necessarily fatal
    process.send({
      type: constants.runner_message_type.FATAL,
      data: {
        error: msg,
        msg: msg
      }
    });
  }

}

if (process.env.SUMAN_DEBUG === 'yes') {
  console.log(' => Suman require.main => ', require.main.filename)
  console.log(' => Suman parent module => ', module.parent.filename);
}

process.on('uncaughtException', function (err) {

  if (typeof err !== 'object') {
    err = { stack: typeof err === 'string' ? err : util.inspect(err) }
  }

  sumanRuntimeErrors.push(err);
  const msg = err.stack || err;

  if (!err._alreadyHandledBySuman) {
    err._alreadyHandledBySuman = true;
    console.error('\n\n', colors.magenta(' => Suman uncaught exception => ' + msg));
  }

  if (String(msg).match(/.suite is not a function/i)) {
    process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
      '\n\tsee oresoftware.github.io/suman\n\n');
  }
  else if (String(msg).match(/.describe is not a function/i)) {
    process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
      '\n\tsee oresoftware.github.io/suman\n\n');
  }

  if (!global.sumanOpts || (global.sumanOpts && global.sumanOpts.ignoreUncaughtExceptions !== false)) {
    global.sumanUncaughtExceptionTriggered = true;
    console.error('\n\n', ' => Given uncaught exception,' +
      ' Suman will now run suman.once.post.js shutdown hooks...');
    console.error('\n\n', ' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
      'the "--ignore-uncaught-exceptions" option.)');
    sendFatalMessageToRunner(msg);
    runOncePostUponSIGINTorUncaughtException();
  }

});

process.on('unhandledRejection', (reason, p) => {
  reason = (reason.stack || reason);
  console.error('Unhandled Rejection at: Promise ', p, '\n\n=> Rejection reason => ', reason, '\n\n=> stack =>', reason);

  if (!global.sumanOpts || (global.sumanOpts && global.sumanOpts.ignoreUncaughtExceptions !== false)) {
    global.sumanUncaughtExceptionTriggered = true;
    sendFatalMessageToRunner(reason);
    process.exit(53); //have to hard-code in case suman-constants file is not loaded
  }
});

const oncePost = require('./once-post');

/////////////////////////////////////////////////////////////////////

const weAreDebugging = require('./debugging-helper/we-are-debugging');

//////////////////////////////////////////////////////////////////////

// core
const domain = require('domain');
const os = require('os');
const assert = require('assert');
const path = require('path');
const cp = require('child_process');
const EE = require('events');
const stream = require('stream');
const util = require('util');
const fs = require('fs');

// npm
const stack = require('callsite');
const _ = require('lodash');
const colors = require('colors/safe');
const pragmatik = require('pragmatik');

// project  //TODO: move these into init fn
const rules = require('./helpers/handle-varargs');
const makeSuman = require('./suman');
const ascii = require('./ascii');
const ansi = require('ansi-styles');
const sumanUtils = require('suman-utils/utils');
const constants = require('../config/suman-constants');
const acquireDeps = require('./acquire-deps');
const iocEmitter = global.iocEmitter = new EE();
const iocContainer = global.iocContainer = {};
const iocProgressContainer = global.iocProgressContainer = {};
const resultBroadcaster = global.resultBroadcaster = global.resultBroadcaster || new EE();
const sumanReporters = global.sumanReporters = global.sumanReporters || [];
const integrantsEmitter = global.integrantsEmitter = global.integrantsEmitter || new EE();
const suiteResultEmitter = global.suiteResultEmitter = global.suiteResultEmitter || new EE();
const allOncePostKeys = global.oncePostKeys = [];
const allOncePreKeys = global.oncePreKeys = [];

///////////////////

var oncePostInvoked = false;

function oncePostFn (cb) {
  if (!oncePostInvoked) {
    oncePostInvoked = true;
    oncePost(_.flattenDeep(global.oncePostKeys), global.userData, function (err, results) {
      if (err) {
        console.error(err.stack || err);
      }
      if (Array.isArray(results)) {  // once-post was actually run this time versus (see below)
        results.filter(r => r).forEach(function (r) {
          console.error(r.stack || r);
        });
      }
      else {
        console.log('Results is not an array... =>', results);
      }
      process.nextTick(cb);
    });
  }
  else {
    process.nextTick(function () {
      cb(new Error(' => Suman warning => oncePostFn was called more than once =>'));
    });
  }
}

function runOncePostUponSIGINTorUncaughtException () {
  oncePostFn(function (err, results) {
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

///////////////////////////////////

function handleRequestResponseWithRunner (data) {

  return function (cb) {

    process.on('message', function onTableDataReceived (data) {
      if (data.info = 'table-data-received') {
        process.removeListener('message', onTableDataReceived);
        cb(null);
      }
    });

    process.send({
      type: constants.runner_message_type.TABLE_DATA,
      data: data
    });
  };

}

const counts = {
  completedCount: 0,
  sumanCount: 0
};

const results = [];

suiteResultEmitter.on('suman-completed', function (obj) {

  counts.completedCount++;
  results.push(obj);

  if (counts.completedCount === counts.sumanCount) {

    var fn;

    var resultz;

    if (global.usingRunner) {
      resultz = results.map(i => i.tableData);
      fn = handleRequestResponseWithRunner(resultz[ 0 ]);
    }
    else {

      // i may not be defined if testsuite (rootsuite) was skipped
      resultz = results.map(i => i ? i.tableData : null).filter(i => i);

      resultz.forEach(function (table) {
        console.log('\n\n');
        var str = table.toString();
        str = '\t' + str;
        console.log(str.replace(/\n/g, '\n\t'));
        console.log('\n');
      });

      fn = oncePostFn;
    }

    const codes = results.map(i => i.exitCode);

    if (process.env.SUMAN_DEBUG === 'yes') {
      console.log(' => All "exit" codes from test suites => ', codes);
    }

    const highestExitCode = Math.max.apply(null, codes);

    fn(function (err) {
      if (err) {
        console.error(err.stack || err);
      }

      process.exit(highestExitCode);

    });

  }
  else if (counts.completedCount > counts.sumanCount) {
    throw new Error('=> Suman internal implementation error => ' +
      'completedCount should never be greater than sumanCount.');
  }

});

//////////////////

const cwd = process.cwd();
const projRoot = global.projectRoot = global.projectRoot || sumanUtils.findProjectRoot(cwd);

////////

// here comes the hotstepper
// cache these values for purposes of SUMAN_SINGLE_PROCESS option

const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const isViaSumanWatch = process.env.SUMAN_WATCH === 'yes';
const main = require.main.filename;
const sumanOptsFromRunner = process.env.SUMAN_OPTS ? JSON.parse(process.env.SUMAN_OPTS) : {};
const sumanOpts = global.sumanOpts = global.sumanOpts || sumanOptsFromRunner;
const usingRunner = global.usingRunner = (global.usingRunner || process.env.SUMAN_RUNNER === 'yes');

var config, pth1, pth2;

//TODO: config is also being serialized to JSON, so we could read that instead
if (!(config = global.sumanConfig)) {
  try {
    pth1 = path.resolve(path.normalize(cwd + '/' + configPath));
    config = require(pth1); //TODO: allow for command line input of configPath
  }
  catch (err) {
    try {
      pth1 = null;  //force null for logging below
      pth2 = path.resolve(path.normalize(projRoot + '/suman.conf.js')); //this fails when
      config = require(pth2); //TODO: allow for command line input of configPath
    }
    catch (err) {
      pth2 = null;

      throw new Error(' => Suman message => Warning - no configuration (suman.conf.js) ' +
        'found in the root of your project.\n  ' + (err.stack || err));

      // console.log(' => Suman message => could not resolve path to config file either in your current working directory' +
      //     ' or at the root of your project.');
      // console.log(colors.bgCyan.white(' => Suman message => Using default Suman configuration.'));
      //
      // try {
      //     var pth = path.resolve(__dirname + '/../default-conf-files/suman.default.conf.js');
      //     config = require(pth);
      //     //if (config.verbose !== false) {  //default to true
      //     //    console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
      //     //}
      // }
      // catch (err) {
      //     console.log('\n => ' + err.stack + '\n');
      //     process.exit(constants.EXIT_CODES.COULD_NOT_FIND_CONFIG_FROM_PATH);
      //     return;
      // }
    }
  }

  global.sumanConfig = config;

  var maxMem = global.maxMem = {
    heapTotal: 0,
    heapUsed: 0
  };

  var interval = global.sumanConfig.checkMemoryUsage ? setInterval(function () {

    const m = process.memoryUsage();
    if (m.heapTotal > maxMem.heapTotal) {
      maxMem.heapTotal = m.heapTotal;
    }
    if (m.heapUsed > maxMem.heapUsed) {
      maxMem.heapUsed = m.heapUsed;
    }

  }, 5) : null;

  const pkgJSON = require('../package.json');
  const v = pkgJSON.version;
  console.log(' => Node.js version =>', process.version);
  console.log(colors.gray.italic(' => Suman v' + v + ' running individual test suite...'));
  console.log(' => cwd: ' + cwd);
  if (pth1 || pth2) {
    if (global.sumanOpts.verbose) {
      console.log(' => Suman verbose message => Suman config Z used: ' + (pth1 || pth2), '\n');
    }
  }
}

if (global.sumanOpts.verbose && !usingRunner && !global.viaSuman) {
  console.log(' => Suman verbose message => Project root:', projRoot);
}

global.sumanHelperDirRoot = global.sumanHelperDirRoot ||
  path.resolve(projectRoot + '/' + (global.sumanConfig.sumanHelpersDir || 'suman'));

const sumanHelpersDir = path.resolve(global.sumanHelperDirRoot);
const logDir = path.resolve(global.sumanHelperDirRoot + '/logs');
const errStrmPath = path.resolve(global.sumanHelperDirRoot + '/logs/test-debug.log');

require('./helpers/create-helpers-logs')(sumanHelpersDir, logDir);

var integPath;

try {
  integPath = global.integPath = require(path.resolve(global.sumanHelperDirRoot + '/suman.once.js'));
}
catch (err) {
  console.error('=> Suman error: no suman.once.js file found at root of your project => ' + (err.stack || err));
  process.exit(constants.EXIT_CODES.SUMAN_PRE_NOT_FOUND_IN_YOUR_PROJECT);
}

try {
  assert(typeof integPath === 'function', 'Your suman.once.js file needs to export a function.');
}
catch (err) {
  console.error(err.stack || err);
  process.exit(constants.EXIT_CODES.SUMAN_PRE_DOES_NOT_EXPORT_FUNCTION);
}

var ioc;

try {
  //TODO: need to update this
  ioc = require(path.resolve(global.sumanHelperDirRoot + '/suman.ioc.js'));
}
catch (err) {
  try {
    //TODO: shouldn't have to call findProjectRoot() here...should be already defined
    ioc = require(path.resolve(sumanUtils.findProjectRoot(process.cwd()) + '/suman/suman.ioc.js'));
  } catch (err) {
    console.log(' => Suman tip => Create your own suman.ioc.js file instead of using the default file.\n');
    ioc = require(path.resolve(__dirname + '/../default-conf-files/suman.default.ioc.js'));
  }
}

//TODO: do a better job of loading reporters
//TODO: probably don't need to store reporters in array, at all
//TODO: need to improve logic on when to load std-reporter (?)

if (!global.viaSuman && !usingRunner && global.sumanReporters.length < 1) {
  const fn = require(path.resolve(__dirname + '/reporters/std-reporter'));
  assert(typeof fn === 'function', 'Native reporter fail.');
  global.sumanReporters.push(fn);
  fn.apply(global, [ global.resultBroadcaster ]);
}

var loaded = false;

function init ($module, $opts) {

  ///////////////////////////////////
  debugger;  // leave this here forever for debugging child processes
  ///////////////////////////////////

  global.sumanInitCalled = true;
  require('./handle-exit'); // handle exit here

  if (this instanceof init) {
    console.error(' => Suman usage warning: no need to use "new" keyword with the suman.init()' +
      ' function as it is not a standard constructor');
    return init.apply(null, arguments);
  }

  //////
  if (require.main !== $module && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
    if (!String(require.main.filename).match(/\/suman\/index\.js/)) {
      console.warn('\n\n => Suman usage warning => suman was required from module => ', require.main.filename);
    }
  }

  if (init.$ingletonian) {
    if (process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
      console.error(' => Suman usage warning => suman.init() only needs to be called once per test file.');
      return init.$ingletonian;
    }
  }

  //TODO: verify that writable is actually a proper writable stream
  //TOOD: what if user overwrites module.exports in the test file?
  const exportEvents = $module.exports = $module.exports || (writable || Transform());
  const testsuites = exportEvents._testsuites = exportEvents._testsuites || [];

  Object.defineProperty($module, 'exports', {
    writable: false
  });

  // TODO: could potention figure out what original test module is via suman.init call, instead of
  // requiring that user pass it explicitly

  if (!loaded) {

    //note that these calls need to be inside suman.init() so they don't get loaded by the runner, etc.
    //although perhaps we should put the runner code elsewhere, because user does not need to call runner

    // process.on('uncaughtException', function (err) {
    //     console.error('\n\n => Suman uncaught exception => ', err.stack || err);
    //     console.error('\n\n', ' => Given uncaught exception,' +
    //         ' Suman will now run suman.once.post.js shutdown hooks...');
    //     console.error('\n\n', ' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
    //         'the "--ignore-uncaught-exceptions" option.)');
    //     runOncePostUponSIGINTorUncaughtException();
    // });

    // process.on('SIGINT', function handleSIGINT(int) {
    //     process.removeListener('SIGINT', handleSIGINT);  // if SIGINT is fired twice, let's die right away instead
    //     console.error(' => Suman SIGINT caught => ', int);
    //     console.error(' => Given SIGINT, Suman will now run suman.once.post.js shutdown hooks...');
    //     runOncePostUponSIGINTorUncaughtException();
    // });

  }

  assert(($module.constructor && $module.constructor.name === 'Module'),
    'Please pass the test file module instance as first arg to suman.init()');
  if ($opts) {
    assert(typeof $opts === 'object' && !Array.isArray($opts),
      'Please pass an options object as a second argument to suman.init()');
  }

  var matches = false;
  if (usingRunner) { //when using runner cwd is set to project root or test file path
    if (process.env.SUMAN_CHILD_TEST_PATH === $module.filename) {
      matches = true;
    }
  }
  else {  //if we run
    if (global.sumanOpts.vverbose) {
      console.log(' => Suman vverbose message => require.main.filename value:', main);
    }
    if (main === $module.filename) {
      matches = true;
    }
  }

  const opts = $opts || {};

  //TODO: allow users to have multiple suman.conf.js files for different tests in their project?
  // const configPath = opts.configPath;

  const integrants = opts.integrants || opts.pre || [];
  assert(Array.isArray(integrants), '"integrants" must be an array type.');

  if (opts.__expectedExitCode !== undefined && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
    const expectedExitCode = global.expectedExitCode = global.expectedExitCode || opts.__expectedExitCode;
    assert(Number.isInteger(expectedExitCode) && expectedExitCode > -1, ' => Suman usage error => Expected exit ' +
      'code not an acceptable integer.');
  }

  if (opts.timeout !== undefined && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
    const timeout = global.expectedTimeout = opts.timeout;
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
  const exportTests = (opts.export === true || singleProc);
  const writable = opts.writable || null;
  const iocData = opts.iocData || opts.ioc || {};

  if (iocData) {
    try {
      assert(typeof iocData === 'object' && !Array.isArray(iocData),
        ' => Suman usage error => "ioc" property passed to suman.init() needs ' +
        'to point to an object'); //make sure it's an object {}
    }
    catch (err) {
      console.log(err.stack);
      process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
    }
  }

  if (exportTests) {
    //TODO: if export is set to true, then we need to exit if we are using the runner
    if (process.env.SUMAN_DEBUG === 'yes' || global.sumanOpts.vverbose) {
      console.log(colors.magenta(' => Suman message => export option set to true.'));
    }
  }

  //////////////////////////////////////////////////////////////////

  if (usingRunner) {

    // fs.writeFileSync(errStrmPath, '\n', {flags: 'a', encoding: 'utf8'});
    // fs.appendFileSync(errStrmPath, 'start', {flags: 'a'});

    global._writeTestError = function () {

      const data = Array.prototype.slice.call(arguments).filter(i => i);

      data.forEach(function (d) {

        if (typeof d !== 'string') {
          d = util.inspect(d);
        }

        process.stderr.write(d);  //goes to runner

        if (process.env.SUMAN_DEBUG === 'yes') {
          fs.appendFileSync(errStrmPath, d);
        }
      });

    };

    global._writeLog = function (data) {
      // use process.send to send data to runner? or no-op
      if (process.env.SUMAN_DEBUG === 'yes') {
        fs.appendFileSync(errStrmPath, data);
      }
    }
  }
  else {

    const strmStdoutPath = path.resolve(global.sumanHelperDirRoot + '/logs/test-output.log');
    const strmStdout = fs.createWriteStream(strmStdoutPath, { flags: 'w' });

    strmStdout.write.apply(strmStdout, [ ' => New Suman run.' ]);

    global._writeLog = function (data) {
      fs.appendFileSync(strmStdoutPath, data);
    };

    // const strm = global.testStderrStrm = fs.createWriteStream(errStrmPath, {flags: 'w'});

    global._writeTestError = function (data, ignore) {
      if (!ignore) {
        global.checkTestErrorLog = true;
      }
      // strm.write.apply(strm, arguments);
      fs.appendFileSync(errStrmPath, '\n' + data + '\n');
    };

    fs.writeFileSync(errStrmPath, '\n\n', { flags: 'a', encoding: 'utf8' });
    global._writeTestError('\n\n', true);
    global._writeTestError(' ### Suman start run indiv. @' + new Date() + ' ###', true);
    global._writeTestError(' ### Filename: ' + $module.filename, true);
    global._writeTestError(' ### Command = ' + JSON.stringify(process.argv), true);
  }

  if (!singleProc) { // add this later: && !usingRunner
    console.log(ascii.suman_slant, '\n');
  }

  ////////////////////////////////////////////////////////////////

  var integrantsFn = null;
  var integrantsReady = null;
  var postOnlyReady = null;

  if (waitForIntegrantResponses || process.env.SUMAN_SINGLE_PROCESS === 'yes') {
    integrantsReady = false;
  }

  if (waitForResponseFromRunnerRegardingPostList) {
    postOnlyReady = false;
  }

  if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
    integrantsFn = function noop () {
    };
  }
  else if (integrants.length < 1) {
    integrantsFn = function () {
      process.nextTick(function () {
        integrantsEmitter.emit('vals', {});
      });
    }
  }
  else if (global.usingRunner) {

    integrantsFn = function () {

      const integrantsFromParentProcess = [];
      const oncePreVals = {};

      if (integrantsReady) {
        process.nextTick(function () {
          integrantsEmitter.emit('vals', oncePreVals);
        });
      }
      else {
        var integrantMessage = function (msg) {
          if (msg.info === 'integrant-ready') {
            integrantsFromParentProcess.push(msg.data);
            oncePreVals[ msg.data ] = msg.val;
            if (sumanUtils.checkForEquality(integrants, integrantsFromParentProcess)) {
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
          expectedExitCode: global.expectedExitCode,
          expectedTimeout: global.expectedTimeout
        });
      }
    }
  }
  else {
    integrantsFn = function () {

      //TODO: if multiple test files are reference in project and it is run without the runner,
      // we need to check if integrants are already ready

      const depContainerObj = integPath({ temp: 'we are in suman project => lib/index.js' });
      const d = domain.create();

      d.once('error', function (err) {

        err = new Error(' => Suman fatal error => there was a problem verifying the ' +
          'integrants listed in test file "' + $module.filename + '"\n' + err.stack);

        if (global.usingRunner) {
          process.send({
            type: constants.runner_message_type.FATAL,
            data: {
              msg: err.stack,
              stack: err.stack
            }
          });
        }

        console.error(err.stack);
        global._writeTestError(err.stack);
        process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
      });

      d.run(function () {
        acquireDeps(integrants, depContainerObj, sumanUtils.onceAsync(null, function (err, vals) {
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
      });
    }
  }

  var integrantsInvoked = false;
  init.tooLate = false;

  function start (desc, opts, cb) {

    // const [desc, opts, fn] = pragmatik.parse(arguments, r);
    // const obj = handleExtraOpts.handleExtraOpts(desc, opts, cb);
    const _args = pragmatik.parse(arguments, rules.blockSignature);
    desc = _args[ 0 ];
    opts = _args[ 1 ];
    cb = _args[ 2 ];

    if (init.tooLate === true && process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
      console.error(' => Suman usage fatal error => You must call Test.describe() synchronously => ' +
        'in other words, all Test.describe() calls should be registered in the same tick of the event loop.');
      return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
    }

    const sumanEvents = Transform();
    testsuites.push(sumanEvents);

    process.nextTick(function () {
      init.tooLate = true;
    });

    counts.sumanCount++;

    const args = Array.prototype.slice.call(arguments);

    assert(typeof desc === 'string', 'First argument to top-level describe must be a string ' +
      'description/title for the test suite.');
    if (args.length < 2) {
      throw new Error('Not enough args. Signature is Test.describe(String s, [Object opts], Function f)');
    }
    else if (args.length < 3) {
      assert(typeof cb === 'function', 'Options object is omitted, but then second argument ' +
        'must be a callback function.');
    }
    else if (args.length < 4) {
      assert(typeof opts === 'object' && !Array.isArray(opts), 'Options object should be a ' +
        'plain {} object, instead we got => ' + util.inspect(opts));
      assert(typeof cb === 'function', 'Options object is omitted, and in that case the ' +
        'second argument must be a callback function.');
    }
    else {
      throw new Error('Too many args. Signature is Test.describe(String s, [opts o], Function f)')
    }

    const to = setTimeout(function () {
      console.error(' => Suman usage error => Integrant acquisition timeout.');
      process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
    }, global.weAreDebugging ? 50000000 : 50000);

    function onPreVals (vals) {

      clearTimeout(to);

      if (!global.iocConfiguration || process.env.SUMAN_SINGLE_PROCESS === 'yes') {

        iocData[ 'suman.once.pre.js' ] = vals;
        // should copy the data not directly reference it, should be stringifiable/serializable
        global.userData = JSON.parse(JSON.stringify(iocData));

        //TODO: perhaps pass suman.once.pre.js data to ioc also
        global.iocConfiguration = ioc(iocData) || {};
      }

      //TODO: need to properly toggle boolean that determines whether or not to try to create dir
      makeSuman($module, _interface, true, config, function (err, suman) {

        if (err) {
          global._writeTestError(err.stack || err);
          return process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
        }

        suman._sumanModulePath = $module.filename;

        if (exportTests && matches) {

          const $code = constants.EXIT_CODES.EXPORT_TEST_BUT_RAN_TEST_FILE_DIRECTLY;

          console.error(' => Suman error => You have declared export:true in your suman.init call, but ran the test directly.');
          //note: need to be explicit since we haven't attached process.on('exit') handler yet...
          console.log('\n\n => Suman exiting with code: ', $code, '\n\n');

          if (usingRunner) {
            suman.logFinished(null, function (err, exitCode) {
              process.exit($code);  //use original code
            });
          }
          else {
            global._writeTestError(' => Suman error => You have declared export:true in your suman.init call, but ran the test directly.');
            process.exit($code);
          }

        }
        else {

          suman._sumanEvents = sumanEvents;

          const run = require('./exec-suite').main(suman);

          if (process.domain) {
            try {
              process.domain.exit();
            }
            catch (err) {

            }
          }

          setImmediate(function () {

            // IMPORTANT: setImmediate allows for future possibility of multiple test suites referenced in the same file
            // other async "integrantsFn" probably already does this

            if (exportTests === true) { //TODO: if we use this, need to make work with integrants/blocked etc.

              sumanEvents.emit('test', function () {
                suman.extraArgs = Array.prototype.slice.call(arguments);
                run.apply(global, args);
              });

              if (false && writable) {
                args.push([]); // [] is empty array representing extra/ $uda
                args.push(writable); //TODO: writable should be same as sumanEvents (?)
                // args.push(iocData);
                // args.push(suman.userData);
                run.apply(global, args);
              }

            }
            else {
              run.apply(global, args);  //args are most likely (desc,opts,cb)
            }
          });
        }

      });

    }

    if (process.env.SUMAN_SINGLE_PROCESS !== 'yes') {
      integrantsEmitter.once('error', function (err) {
        clearTimeout(to);
        console.error(err.stack || err);
        global._writeTestError(err.stack || err);
        process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
      });

      integrantsEmitter.once('vals', onPreVals);
    }
    else {
      sumanEvents.once('vals', onPreVals);
    }

    //we run integrants function
    process.nextTick(function () {
      if (!integrantsInvoked) {
        integrantsInvoked = true;
        integrantsFn();
      }
    });

  }

  init.$ingletonian = {
    parent: $module.parent, //parent is who required the original $module
    file: global.sumanTestFile = $module.filename
  };

  start.skip = init.$ingletonian.skip = function () {
    const args = pragmatik.parse(arguments, rules.blockSignature);
    args[ 1 ].skip = true;
    start.apply(this, args);
  };

  start.only = init.$ingletonian.only = function () {
    const args = pragmatik.parse(arguments, rules.blockSignature);
    global.describeOnlyIsTriggered = true;
    args[ 1 ].only = true;
    start.apply(this, args);
  };

  start.delay = init.$ingletonian.delay = function () {
    const args = pragmatik.parse(arguments, rules.blockSignature);
    args[ 1 ].delay = true;
    start.apply(this, args);
  };

  const create = init.$ingletonian.create = start;
  _interface === 'TDD' ? init.$ingletonian.suite = create : init.$ingletonian.describe = create;

  loaded = true;
  return init.$ingletonian;
}

function Writable (type) {

  if (this instanceof Writable) {
    return Writable.apply(global, arguments);
  }

  //type: duplex, transform etc

  const strm = new stream.Writable({
    write: function (chunk, encoding, cb) {
      console.log('index chunks:', String(chunk));
    }
  });
  strm.cork();

  return strm;

}

//TODO: https://gist.github.com/PaulMougel/7961469

function Transform (obj) {

  //TODO: http://stackoverflow.com/questions/10355856/how-to-append-binary-data-to-a-buffer-in-node-js

  // const strm = new stream.Transform({
  //
  //     transform: function (chunk, encoding, cb) {
  //
  //         var data = chunk.toString();
  //         if (this._lastLineData) {
  //             data = this._lastLineData + data;
  //         }
  //
  //         console.log('data:', data);
  //
  //         var lines = data.split('\n');
  //         this._lastLineData = lines.splice(lines.length - 1, 1)[0];
  //
  //         lines.forEach(this.push.bind(this));
  //         cb();
  //     }
  // });

  var BufferStream = function () {
    stream.Transform.apply(this, arguments);
    this.buffer = [];
  };

  util.inherits(BufferStream, stream.Transform);

  BufferStream.prototype._transform = function (chunk, encoding, done) {
    // custom buffering logic
    // ie. add chunk to this.buffer, check buffer size, etc.

    this.push(chunk ? String(chunk) : null);
    this.buffer.push(chunk ? String(chunk) : null);

    done();
  };

  BufferStream.prototype.pipe = function (destination, options) {
    var res = stream.Transform.prototype.pipe.apply(this, arguments);
    this.buffer.forEach(function (b) {
      res.write(String(b));
    });
    return res;
  };

  // strm.cork();
  return new BufferStream();

}

function autoPass () {
  // add t.skip() type functionality // t.ignore().
}

function autoFail () {
  throw new Error('Suman auto-fail. Perhaps flesh-out this hook or test to get it passing.');
}

function once (fn) {

  var cache = null;

  return function (cb) {

    if (cache) {
      process.nextTick(function () {
        cb.apply(null, [ null, cache ]);
      });
    }
    else {
      fn.apply(null, function (err, val) {
        if (!err) {
          cache = val || {
              'Suman says': 'This is a dummy-cache val. ' +
              'See => oresoftware.github.io/suman/tricks-and-tips.html'
            };
        }
        cb.apply(null, arguments);
      });
    }
  }
}

module.exports = {
  autoPass: autoPass,
  autoFail: autoFail,
  init: init,
  constants: constants,
  Writable: Writable,
  Transform: Transform,
  once: once
};

// if(require.main === module){
//     console.log(' => Suman message => running Suman index.');
//     return require('../index');  //when user wants to execute Suman, force usage of other index file
// }