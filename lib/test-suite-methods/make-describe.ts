'use strict';

//dts
import {ITestSuite, IAcceptableOptions} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {TTestSuiteMaker} from "suman-types/dts/test-suite-maker";
import {IDescribeFn, IDescribeOpts, TDescribeHook} from "suman-types/dts/describe";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');
import domain = require('domain');

//npm
const fnArgs = require('function-arguments');
const pragmatik = require('pragmatik');
const _ = require('underscore');
import async = require('async');
import * as chalk from 'chalk';
import su from 'suman-utils';
import {VamootProxy} from 'vamoot';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
import {constants} from '../../config/suman-constants';
import {acquireIocDeps} from '../acquire-dependencies/acquire-ioc-deps';
import {IInjectionDeps} from "suman-types/dts/injection";
const {handleSetupComplete} = require('../handle-setup-complete');
import {makeBlockInjector} from '../injection/make-block-injector';
import {handleInjections} from '../test-suite-helpers/handle-injections';
import {parseArgs} from '../helpers/parse-pragmatik-args';
import evalOptions from '../helpers/eval-options';

///////////////////////////////////////////////////////////////////////

const typeName = 'describe';
const acceptableOptions = <IAcceptableOptions> {
  skip: true,
  only: true,
  delay: true,
  parallel: true,
  limit: true,
  series: true,
  mode: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IDescribeOpts) {
  Object.keys(opts).forEach(function (k) {
    if (!acceptableOptions[k]) {
      const url = `${constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
      throw new Error(`'${k}' is not a valid option property for ${typeName} hooks. See: ${url}`);
    }
  });
};

//////////////////////////////////////////////////////////////////////////////////////////////

export const makeDescribe = function (suman: ISuman, gracefulExit: Function, TestBlock: ITestSuite,
                                      zuite: ITestSuite, notifyParentThatChildIsComplete: Function,
                                      blockInjector: Function): IDescribeFn {

  //////////////////////////////////////////////////////////////////////////////////////////////

  return function ($$desc: string, $opts: IDescribeOpts) {

    const {sumanOpts} = _suman;
    handleSetupComplete(zuite, 'describe');

    const args = pragmatik.parse(arguments, rules.blockSignature, {
      preParsed: su.isObject($opts) ? $opts.__preParsed : null
    });

    const vetted = parseArgs(args);
    const [desc, opts, cb] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    handleBadOptions(opts);

    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps, opts);
    }

    const allDescribeBlocks = suman.allDescribeBlocks;
    const isGenerator = su.isGeneratorFn(cb);
    const isAsync = su.isAsyncFn(cb);

    if (isGenerator || isAsync) { //TODO: need to check for generators or async/await as well
      const msg = constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
      console.log('\n\n' + msg + '\n\n');
      console.error(new Error(' => Suman usage error => invalid arrow/generator function usage.').stack);
      process.exit(constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
      return;
    }

    if (zuite.parallel && opts.parallel === false) {
      console.error('\n');
      _suman.logWarning('warning => parent block ("' + zuite.desc + '") is parallel, ' +
        'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
      _suman.logWarning('\nTo see more info on this, visit: sumanjs.org.\n');
    }

    if (zuite.skipped) {
      let msg = 'Suman implementation warning => Child block entered when parent was skipped.';
      console.error(msg);
      console.error(' => Please open an issue with the following stacktrace:', '\n');
      console.error(new Error(msg).stack);
      console.log('\n');
    }

    if (opts.skip && !sumanOpts.force && !sumanOpts.allow_skip) {
      throw new Error('Test block was declared as "skipped" but "--allow-skip" option not specified.');
    }

    if (opts.only && !sumanOpts.force && !sumanOpts.allow_only) {
      throw new Error('Test block was declared as "only" but "--allow-only" option not specified.');
    }

    if (opts.skip || zuite.skipped || (!opts.only && suman.describeOnlyIsTriggered)) {
      suman.numBlocksSkipped++;
      return;
    }

    // note: zuite is the parent of suite; aka, suite is the child of zuite
    const suite = new TestBlock({desc, title: desc, opts});

    if(zuite.fixed){
      suite.fixed = true;
    }

    // if parent is skipped, child is skipped,
    suite.skipped = opts.skip || zuite.skipped;

    if (!suite.only && suman.describeOnlyIsTriggered) {
      suite.skipped = suite.skippedDueToDescribeOnly = true;
    }

    if (suite.only) {
      suman.describeOnlyIsTriggered = true;
    }

    Object.defineProperty(suite, 'parent', {value: zuite, writable: false});
    zuite.getChildren().push(suite);
    allDescribeBlocks.push(suite);
    const deps = fnArgs(cb);


    suite._run = function run(val: any, callback: Function) {

      if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
        notifyParentThatChildIsComplete(zuite, callback);
        return;
      }

      const d = domain.create();

      d.once('error', function blockRegistrationErrorHandler(err: IPseudoError) {
        console.error('\n');
        if (!err || typeof err !== 'object') {
          err = new Error(err ? (typeof err === 'string' ? err : util.inspect(err)) : 'unknown error passed to handler');
        }
        _suman.logError('Error registering test block =>', err.stack || err);
        err.sumanExitCode = constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
        gracefulExit(err);
      });

      d.run(function registerTheBlock() {

        // note: *very important* => each describe block needs to be invoked in series, one by one,
        // so that we bind skip and only to the right suite

        suite.getResumeValue = function (): any {
          return val;
        };

        suite.bindExtras();

        debugger;

        Object.defineProperty(suite, 'shared', {
          value: zuite.shared.clone(),
          writable: false
        });

        acquireIocDeps(suman, deps, suite, function (err: Error, depz: IInjectionDeps) {

          if (err) {
            _suman.logError(err.stack || err);
            process.exit(constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
            return;
          }

          process.nextTick(function () {

            let $deps;

            try {
              $deps = blockInjector(suite, zuite, depz);
            }
            catch (err) {
              return gracefulExit(err);
            }

            suite.fatal = function (err: IPseudoError) {
              err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
              _suman.logError(err.stack || err);
              err.sumanExitCode = constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
              gracefulExit(err);
            };

            const delayOptionElected = !!opts.delay;

            if (!delayOptionElected) {

              suite.__resume = function () {
                _suman.logWarning('usage warning => suite.resume() has become a no-op since delay option is falsy.');
              };

              // Object.freeze(suite);
              // Object.freeze(suite);
              cb.apply(suite, $deps);

              handleInjections(suite, function (err: Error) {

                if (err) {
                  gracefulExit(err);
                }
                else {
                  d.exit();
                  suite.isSetupComplete = true;
                  process.nextTick(function () {
                    zuite.bindExtras();  //bind extras back to parent test
                    suite.invokeChildren(null, callback);
                  });
                }
              });

            }

            else {
              suite.isDelayed = true;

              const str = cb.toString();
              //TODO this will not work when delay is simply commented out

              if (!su.checkForValInStr(str, /resume/g, 0)) {

                process.nextTick(function () {
                  console.error(new Error(' => Suman usage error => delay option was elected, so suite.resume() ' +
                    'method needs to be called to continue,' +
                    ' but the resume method was never referenced in the needed location, so your test cases would ' +
                    'never be invoked before timing out => \n\n' + str).stack);
                  process.exit(constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                });

                return; //hard, ugly and visible
              }

              const to = setTimeout(function () {
                console.error('\n\n => Suman fatal error => delay function was not called within alloted time.');
                process.exit(constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
              }, _suman.weAreDebugging ? 5000000 : 11000);

              let callable = true;

              suite.__resume = function (val: any) {
                if (callable) {
                  callable = false;
                  clearTimeout(to);
                  d.exit();
                  //need to make sure delay is called asynchronously, but this should take care of it
                  process.nextTick(function () {
                    suite.isSetupComplete = true; // keep this, needs to be called asynchronously
                    zuite.bindExtras();  //bind extras back to parent test
                    suite.invokeChildren(val, callback); // pass callback
                  });
                }
                else {
                  let w = ' => Suman usage warning => suite.resume() was called more than once.';
                  console.error(w);
                  _suman.writeTestError(w)
                }

              };

              // Object.freeze(suite);
              // Object.freeze(suite);
              cb.apply(suite, $deps);
            }

          });

        });

      });
    };
  };

};
