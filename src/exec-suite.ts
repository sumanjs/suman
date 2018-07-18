'use strict';

//dts
import {IGlobalSumanObj, ISumanDomain, ICurrentPaddingCount} from "suman-types/dts/global";
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
import McProxy = require('proxy-mcproxy');
import chalk from 'chalk';
import * as async from 'async';

const fnArgs = require('function-arguments');
const pragmatik = require('pragmatik');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('./helpers/handle-varargs');
import {constants} from './config/suman-constants';
import su = require('suman-utils');
import {makeGracefulExit} from './make-graceful-exit';
import {acquireIocDeps} from './acquire-dependencies/acquire-ioc-deps';
import {TestBlock} from './test-suite-helpers/test-suite';
import {fatalRequestReply} from './helpers/general';
import {handleInjections} from './test-suite-helpers/handle-injections';
import {makeOnSumanCompleted} from './helpers/general';
import {evalOptions} from './helpers/general';
import general = require('./helpers/general');
import {makeSumanMethods} from "./test-suite-helpers/suman-methods";
import {makeHandleBeforesAndAfters} from './test-suite-helpers/make-handle-befores-afters';
import {makeNotifyParent} from './test-suite-helpers/notify-parent-that-child-is-complete';

//////////////////////////////////////////////////////////////////////////////////////////////////////////

export const execSuite = function (suman: ISuman): Function {

  // we set this so that after.always hooks can run
  _suman.whichSuman = suman;
  const sumanConfig = suman.config;
  suman.dateSuiteStarted = Date.now();
  const onSumanCompleted = makeOnSumanCompleted(suman);
  const gracefulExit = makeGracefulExit(suman);
  const handleBeforesAndAfters = makeHandleBeforesAndAfters(suman, gracefulExit);
  const notifyParent = makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);
  const createInjector = makeSumanMethods(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
  const allDescribeBlocks = suman.allDescribeBlocks;

  ////////////////////////////////////////////////////////////////////////////////////////

  return function runRootSuite($$desc: any, $$opts: any): void {

    const sumanOpts = suman.opts;
    const isPreParsed = su.isObject($$opts) && $$opts.__preParsed;
    const args = pragmatik.parse(arguments, rules.createSignature, isPreParsed);

    const vetted = general.parseArgs(args);
    const [$desc, opts, cb] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    let iocDepNames: Array<string>;

    assert(opts.__preParsed, 'Suman implementation error. ' +
      'Options should be pre-parsed at this point in the program. Please report.');
    delete opts.__preParsed;

    if (arrayDeps && arrayDeps.length > 0) {
      iocDepNames = evalOptions(arrayDeps, opts);
    }
    else {
      iocDepNames = [];
    }

    if (opts.__toBeSourcedForIOC) {
      Object.keys(opts.__toBeSourcedForIOC).forEach(function (v: string) {
        iocDepNames.push(v);
      });
    }

    if (su.isObject(opts.inject)) {
      Object.keys(opts.inject).forEach(function (v: string) {
        iocDepNames.push(v);
      });
    }

    if (Array.isArray(opts.inject)) {
      opts.inject.forEach(function (v: string) {
        iocDepNames.push(v);
      });
    }

    const desc = ($desc === '[suman-placeholder]') ? suman.slicedFileName : $desc;
    // suman description is the same as the description of the top level test block
    suman.desc = desc;

    if (su.isGeneratorFn(cb) || su.isAsyncFn(cb)) {

      const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
      return fatalRequestReply({
          type: constants.runner_message_type.FATAL,
          data: {
            errors: [msg],
            msg: msg
          }
        },
        function () {
          console.error('\n');
          _suman.log.error(msg);
          let err = new Error('Suman usage error => invalid arrow/generator function usage.').stack;
          _suman.log.error(err);
          _suman.writeTestError(err);
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

    const suite = new TestBlock({
      desc,
      isTopLevel: true,
      opts,
      suman,
      gracefulExit,
      handleBeforesAndAfters,
      notifyParent
    });

    suite.bIsFirstArg = deps[0] === 'b';
    suite.isRootSuite = true;
    suite.bindExtras();
    allDescribeBlocks.push(suite);

    // Object.defineProperty(suite, '__inject',{
    //   writable: false,
    //   value: {}
    // });
    //
    // Object.defineProperty(suite, '$inject',{
    //   writable: false,
    //   value: McProxy.create(suite.__inject)
    // });

    const v = suite.__supply = {};
    suite.supply = McProxy.create(v);

    try {
      assert(typeof _suman.globalHooksFn === 'function', '<suman.hooks.js> file must export a function.');
      _suman.globalHooksFn.call(null, suite);
    }
    catch (err) {
      _suman.log.error(chalk.yellow('warning: Could not load your "suman.hooks.js" file'));
      if (!/Cannot find module/i.test(err.message)) {
        throw err;
      }
    }

    if (deps.length < 1) {
      process.nextTick(startWholeShebang, null, []);
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
          _suman.log.error(err.stack || err);
          gracefulExit(err, null);
        });

      });

      d.run(function acquireIocDepsDomainRun() {

        acquireIocDeps(suman, iocDepNames, suite, {}, function (err: any, iocDeps: IInjectionDeps) {

          if (err) {
            _suman.log.error('Error acquiring IoC deps:', err.stack || err);
            return process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
          }

          suite.ioc = iocDeps;

          let mappedDeps: Array<any> = createInjector(suite, deps);

          try {
            d.exit();
          }
          finally {
            process.nextTick(startWholeShebang, mappedDeps);
          }

        });

      });
    }

    //TODO: http://stackoverflow.com/questions/27192917/using-a-domain-to-test-for-an-error-thrown-deep-in-the-call-stack-in-node

    function startWholeShebang(deps: Array<any>) {

      const d = domain.create();

      d.once('error', function ($err: any) {
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

          suite.fatal = function (err: any) {
            process.nextTick(gracefulExit, {
              message: 'Fatal error experienced in root suite => ' + (err.message || err),
              stack: err.stack || err,
              sumanExitCode: constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION
            });
          };

          if (delayOptionElected) {

            suite.isDelayed = true;

            const to = setTimeout(function () {
              console.log('\n\n => Suman fatal error => suite.resume() function was not called within alloted time.');
              process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
            }, _suman.weAreDebugging ? 5000000 : 11000);

            if (sumanOpts.verbosity > 8) {
              console.log(' => Waiting for delay() function to be called...');
            }

            let callable = true;

            suite.__resume = function (val: any) {

              if (callable) {
                callable = false;
                clearTimeout(to);
                process.nextTick(function () {
                  suman.ctx = null; // no suite here; don't need to call bindExtras here, because root suite has no parent
                  suite.isSetupComplete = true; // keep this, needs be called asynchronously
                  //pass start function all the way through program until last child delay call is invoked!
                  suite.invokeChildren(val, start);
                });
              }
              else {
                _suman.log.error('Suman usage warning => suite.resume() was called more than once.');
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

            suite.__resume = function () {
              _suman.log.warning('usage warning => suite.resume() has become a noop since delay option is falsy.');
            };

            cb.apply(null, deps);
            suite.isSetupComplete = true;

            handleInjections(suite, function (err: any) {

              if (err) {
                _suman.log.error(err.stack || err);
                return gracefulExit(err, null);
              }

              process.nextTick(function () {
                suite.invokeChildren(null, start); //pass start function all the way through program until last child delay call is invoked!
              });

            });

          }

        }
      );

    }

    const start = function () {

      _suman.suiteResultEmitter.emit('suman-test-registered', function () {

        const sumanOpts = suman.opts;

        const currentPaddingCount = _suman.currentPaddingCount
          = (_suman.currentPaddingCount || ({} as ICurrentPaddingCount));
        currentPaddingCount.val = 1; // always reset

        const runSuite = function (suite: TestBlock, cb: Function) {

          if (_suman.uncaughtExceptionTriggered) {
            _suman.log.error(`"UncaughtException:Triggered" => halting program.\n[${__filename}]`);
            return;
          }

          let limit = 1;
          if (suite.parallel) {
            if (suite.limit) {
              limit = Math.min(suite.limit, 300);
            }
            else {
              limit = sumanConfig.DEFAULT_PARALLEL_BLOCK_LIMIT || constants.DEFAULT_PARALLEL_BLOCK_LIMIT;
            }
          }

          assert(Number.isInteger(limit) && limit > 0 && limit < 100, 'limit must be an integer between 1 and 100, inclusive.');

          suite.__startSuite((err: any, results: any) => {  // results are object from async.series

            results && _suman.log.error('Suman extraneous results:', results);
            err && _suman.log.error('Suman extraneous test error:', suite);

            const children = suite.getChildren().filter(function (child: TestBlock) {
              return !child.skipped;
            });

            if (children.length < 1) {
              return process.nextTick(cb)
            }

            sumanOpts.series && (currentPaddingCount.val += 3);

            async.eachLimit(children, limit, function (child: TestBlock, cb: Function) {

                // this could be reduced, but leave it for clarity
                runSuite(child, cb);
              },
              function (err: any) {
                sumanOpts.series && (currentPaddingCount.val -= 3);
                err && _suman.log.error('Suman implementation error:', err.stack || err);
                process.nextTick(cb);
              });

          });
        };

        runSuite(allDescribeBlocks[0], function complete() {

          suman.dateSuiteFinished = Date.now();

          if (_suman.uncaughtExceptionTriggered) {
            _suman.log.error(`"UncaughtException" event => halting program.\n[${__filename}]`);
            return;
          }

          if (sumanOpts.parallel_max) {
            suman.getQueue().drain = function () {
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
