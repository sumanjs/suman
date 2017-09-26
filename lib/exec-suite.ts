'use strict';

//dts
import {ITestSuite} from "suman-types/dts/test-suite";
import {IGlobalSumanObj, IPseudoError, ISumanDomain} from "suman-types/dts/global";
import {ISuman, Suman} from "./suman";
import {ICreateOpts, TCreateHook} from "suman-types/dts/index-init";
import {IInjectionDeps} from "suman-types/dts/injection";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import path = require('path');
import assert = require('assert');
import EE = require('events');
import fs = require('fs');
import util = require('util');

//npm
import {VamootProxy} from 'vamoot';
import * as chalk from 'chalk';
import * as async from 'async';
const _ = require('underscore');
const fnArgs = require('function-arguments');
const pragmatik = require('pragmatik');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('./helpers/handle-varargs');
import {constants} from '../config/suman-constants';
import {getQueue} from './helpers/job-queue';
import su from 'suman-utils';
import {makeGracefulExit} from './make-graceful-exit';
import {acquireIocDeps} from './acquire-dependencies/acquire-ioc-deps';
import {makeBlockInjector} from './injection/make-block-injector';
import {makeInjectionContainer} from './injection/injection-container';
import {makeTestSuiteMaker} from './test-suite-helpers/make-test-suite';
const {fatalRequestReply} = require('./helpers/fatal-request-reply');
import {handleInjections} from './test-suite-helpers/handle-injections';
import {makeOnSumanCompleted} from './helpers/on-suman-completed';
import evalOptions from './helpers/eval-options';
import {parseArgs} from './helpers/parse-pragmatik-args';

/*////////////// what it do ///////////////////////////////////////////////


 */////////////////////////////////////////////////////////////////////////

export const execSuite = function (suman: ISuman): Function {

  // we set this so that after.always hooks can run
  _suman.whichSuman = suman;
  suman.dateSuiteStarted = Date.now();
  const onSumanCompleted = makeOnSumanCompleted(suman);
  const container = makeInjectionContainer(suman);
  const blockInjector = makeBlockInjector(suman, container);
  const allDescribeBlocks = suman.allDescribeBlocks;
  const gracefulExit = makeGracefulExit(suman);
  const mTestSuite = makeTestSuiteMaker(suman, gracefulExit, blockInjector);

  return function runRootSuite(): void {

    const args = pragmatik.parse(arguments, rules.createSignature);
    const vetted = parseArgs(args);
    const [$desc, opts, cb] = vetted.args;
    const arrayDeps = vetted.arrayDeps;

    assert(opts.__preParsed, 'Suman implementation error. ' +
      'Options should be pre-parsed at this point in the program. Please report.');

    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps, opts);
    }

    const desc = ($desc === '[suman-placeholder]') ? suman.slicedFileName : $desc;
    // suman description is the same as the description of the top level test block
    suman.desc = desc;

    const allowArrowFn = _suman.sumanConfig.allowArrowFunctionsForTestBlocks;
    const isGenerator = su.isGeneratorFn(cb);
    const isAsync = su.isAsyncFn(cb);

    if (isGenerator || isAsync) {

      const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
      return fatalRequestReply({
        type: constants.runner_message_type.FATAL,
        data: {
          errors: [msg],
          msg: msg
        }
      }, function () {
        console.log(msg + '\n\n');
        console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
        process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
      });

    }

    const deps = suman.deps = fnArgs(cb);
    const delayOptionElected = opts.delay;

    //TODO: we need to warn the user when the give an option to describe or it that is not recognized
    suman.rootSuiteDescription = desc;

    if (!opts.only && _suman.describeOnlyIsTriggered) {
      _suman.writeTestError(' => Suite with description => "' + desc + '" was skipped because another test suite in this file\n' +
        'invoked the only option.');
      onSumanCompleted(0, ' => skipped due to "only" option invoked on another test suite');
      return;
    }

    if (opts.skip) {
      _suman.writeTestError(' => Suite with description => "' + desc + '" was skipped because because you\n' +
        'passed the "skip" option to the test suite.');
      onSumanCompleted(0, ' => skipped due to explicit call of "skip" option');
      return;
    }

    const suite = mTestSuite({desc, isTopLevel: true, opts});
    suite.isRootSuite = true;
    suite.__bindExtras();
    allDescribeBlocks.push(suite);

    try {
      //TODO: make this path reference the resolved paths in the resolved paths module
      const globalHooks = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.hooks.js'));
      assert(typeof globalHooks === 'function', 'suman.hooks.js must export a function.');
      //TODO: DI injection should apply here as well
      globalHooks.call(null, suite);
    }
    catch (err) {
      _suman.logError(chalk.magenta('warning => Could not find the "suman.hooks.js" ' +
        'file in your <suman-helpers-dir>.\n Create the file to remove the warning.'), '\n\n');
    }

    if (deps.length < 1) {
      process.nextTick(function () {
        startWholeShebang([]);
      });
    }
    else {

      const d = domain.create();

      d.once('error', function (err: Error) {
        console.error(err.stack || err);
        _suman.writeTestError(err.stack || err);

        d.exit();
        process.nextTick(function () {
          err = new Error('Suman usage error => Error acquiring IOC deps => \n' + (err.stack || err));
          err.sumanFatal = true;
          err.sumanExitCode = constants.EXIT_CODES.IOC_DEPS_ACQUISITION_ERROR;
          _suman.logError(err.stack || err);
          gracefulExit(err, null);
        });

      });

      d.run(function acquireIocDepsDomainRun() {

        acquireIocDeps(suman, deps, suite, function (err: IPseudoError, depz: IInjectionDeps) {

          if (err) {
            _suman.logError('error acquiring IoC deps:', err.stack || err);
            return process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
          }

          let $deps: Array<any> = blockInjector(suite, null, depz);

          d.exit();
          process.nextTick(startWholeShebang, $deps);

        });

      });
    }

    //TODO: http://stackoverflow.com/questions/27192917/using-a-domain-to-test-for-an-error-thrown-deep-in-the-call-stack-in-node

    function startWholeShebang(deps: Array<any>) {

      const d = domain.create();

      d.once('error', function ($err: IPseudoError) {
        d.exit();
        process.nextTick(gracefulExit, {
          message: $err.message || $err,
          stack: $err.stack || $err,
          sumanFatal: true,
          sumanExitCode: constants.EXIT_CODES.ERROR_IN_ROOT_SUITE_BLOCK
        });
      });

      Object.defineProperty(suite, 'shared', {value: new VamootProxy(), writable: false});

      d.run(function () {

          suite.fatal = function (err: IPseudoError) {
            process.nextTick(gracefulExit, {
              message: 'Fatal error experienced in root suite => ' + (err.message || err),
              stack: err.stack || err,
              sumanExitCode: constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION
            });
          };

          if (delayOptionElected) {

            Object.getPrototypeOf(suite).isDelayed = true;

            const to = setTimeout(function () {
              console.log('\n\n => Suman fatal error => suite.resume() function was not called within alloted time.');
              process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
            }, _suman.weAreDebugging ? 5000000 : 11000);

            if (_suman.sumanOpts.verbosity > 8) {
              console.log(' => Waiting for delay() function to be called...');
            }

            let callable = true;

            Object.getPrototypeOf(suite).__resume = function (val: any) {

              if (callable) {
                callable = false;
                clearTimeout(to);
                process.nextTick(function () {
                  suman.ctx = null; // no suite here; don't need to call __bindExtras here, because root suite has no parent
                  suite.__proto__.isSetupComplete = true; // keep this, needs be called asynchronously
                  //pass start function all the way through program until last child delay call is invoked!
                  suite.__invokeChildren(val, start);
                });
              }
              else {
                _suman.logError('Suman usage warning => suite.resume() was called more than once.');
              }
            };

            const str = cb.toString();

            if (!su.checkForValInStr(str, /resume/g, 0)) { //TODO this will not work when delay is simply commented out
              process.nextTick(function () {
                console.error(new Error(' => Suman usage error => suite.resume() method needs to be called to continue,' +
                  ' but the resume method was never referenced, so your test cases would never be invoked before timing out.').stack
                  + '\n =>' + str);
                process.exit(constants.EXIT_CODES.DELAY_NOT_REFERENCED);
              });
            }
            else {
              cb.apply(suite, deps);
            }
          }
          else {

            Object.getPrototypeOf(suite).__resume = function () {
              _suman.logWarning('usage warning => suite.resume() has become a noop since delay option is falsy.');
            };

            cb.apply(suite, deps);
            Object.getPrototypeOf(suite).isSetupComplete = true;

            handleInjections(suite, function (err: IPseudoError) {

              if (err) {
                _suman.logError(err.stack || err);
                gracefulExit(err, null);
              }
              else {
                process.nextTick(function () {
                  suite.__invokeChildren(null, start); //pass start function all the way through program until last child delay call is invoked!
                });
              }

            });

          }

        }
      );

    }

    const start = function () {

      _suman.suiteResultEmitter.emit('suman-test-registered', function () {

        const sumanOpts = _suman.sumanOpts;

        _suman.currentPaddingCount = _suman.currentPaddingCount || {};
        _suman.currentPaddingCount.val = 1; // always reset to 4...

        function runSuite(suite: ITestSuite, cb: Function) {

          if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.logError(`"UncaughtException:Triggered" => halting program.\n[${__filename}]`);
            return;
          }

          const fn: Function = async.eachLimit;

          let limit = 1;
          if (suite.parallel) {
            if (suite.limit) {
              limit = Math.min(suite.limit, 300);
            }
            else {
              limit = _suman.sumanConfig.DEFAULT_PARALLEL_BLOCK_LIMIT || constants.DEFAULT_PARALLEL_BLOCK_LIMIT;
            }
          }

          assert(Number.isInteger(limit) && limit > 0 && limit < 100, 'limit must be an integer between 1 and 100, inclusive.');

          suite.__startSuite(function (err: IPseudoError, results: Object) {  // results are object from async.series

            results && _suman.logError('results => ', results);
            err && _suman.logError('Test error data before log:', suite);

            const children = suite.getChildren().filter(function (child: ITestSuite) {
              //TODO: this might be wrong, may need to omit filter
              return !child.skipped;
            });

            if (children.length < 1) {
              process.nextTick(cb)
            }
            else {

              sumanOpts.series && (_suman.currentPaddingCount.val += 3);

              fn(children, limit, function (child: ITestSuite, cb: Function) {

                runSuite(child, cb);

              }, function (err: IPseudoError) {

                sumanOpts.series && (_suman.currentPaddingCount.val -= 3);
                err && _suman.logError('Suman implementation error => ', err.stack || err);
                process.nextTick(cb);

              });
            }
          });
        }

        runSuite(allDescribeBlocks[0], function complete() {

          suman.dateSuiteFinished = Date.now();

          if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.logError(`"UncaughtException" event => halting program.\n[${__filename}]`);
            return;
          }

          if (sumanOpts.parallel_max) {
            getQueue().drain = function () {
              onSumanCompleted(0, null);
            }
          }
          else {
            onSumanCompleted(0, null);
          }

        });

      });

    }
  };

};
