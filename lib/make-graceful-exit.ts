'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import async = require('async');
import * as chalk from 'chalk';
import {ISuman} from "../dts/suman";

const flattenDeep = require('lodash.flattendeep');
import su = require('suman-utils');
import {IGlobalSumanObj, IPseudoError} from "../dts/global";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {runAfterAlways} = require('./helpers/run-after-always');
const {constants} = require('../config/suman-constants');
const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const {fatalRequestReply} = require('./helpers/fatal-request-reply');
const debug = require('suman-debug')('s:graceful-exit');

///////////////////////////////////////////////////////////////////////////

const testErrors = _suman.testErrors = _suman.testErrors || [];
const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];

/////////////////////////////////////////////////////////////////////////////

export const makeGracefulExit = function (suman: ISuman) {

  return function runGracefulExitOrNot($errs: Error | IPseudoError | Array<any>, cb: Function) {

    const fst = _suman.sumanOpts.full_stack_traces;

    if (cb && typeof cb !== 'function') {
      throw new Error('Suman implementation error - callback was not passed to gracefulExit, please report.');
    }

    let highestExitCode = 0;
    let exitTestSuite = false;
    let errs: Array<Error> = flattenDeep([$errs]).filter((e: Error) => e);

    if (_suman.sumanUncaughtExceptionTriggered) {
      _suman.logError('"uncaughtException" event occurred => halting program.');
      if (errs.length) {
        errs.filter(e => e).forEach(function (e) {
          console.error('Most likely unrelated error => Graceful exit error => ' + (e.stack || e));
        });
      }
      // do not continue, return here?
      // TODO: need to fix this
      _suman.logError('reached graceful exit, but "sumanUncaughtExceptionTriggered" was already true.');
      return cb && process.nextTick(cb);
    }

    const big = errs.filter(function (err) {

      if (err && err.isFromTest && !_suman.sumanOpts.bail) {
        return undefined;
      }
      else if (err && err.sumanFatal === false) {
        return undefined;
      }
      else if (err && err instanceof Error) {
        return err;
      }
      else if (err) {

        if (err.stack) {
          return err;
        }
        else {
          return new Error(util.inspect(err));
        }
      }
      else {
        //explicit for your pleasure
        return undefined;
      }
    })
    .map(function (err: IPseudoError) {

      let sumanFatal = err.sumanFatal;
      let exitCode = err.sumanExitCode;

      if (exitCode) {
        console.error('\n');
        _suman.logError('positive exit code with value', exitCode);
      }

      if (exitCode > highestExitCode) {
        highestExitCode = exitCode;
      }

      let stack = String(err.stack || err).split('\n').filter(function (item, index) {

        if (fst) {
          // if we are using full stack traces, then we include all lines of trace
          return true;
        }

        if (index < 2) {
          // always include first two lines
          return true;
        }

        if (String(item).match(/\//) &&
          !String(item).match(/\/node_modules\//) &&
          !String(item).match(/next_tick.js/)) {
          return true;
        }

      });

      stack[0] = chalk.bold(stack[0]);
      return stack.join('\n').concat('\n');

    })
    .map(function (err: Error) {

      exitTestSuite = true;
      sumanRuntimeErrors.push(err);

      const isBail = _suman.sumanOpts.bail ? '(note that the "--bail" option set to true)\n' : '';
      const str = '\n⚑ ' + chalk.bgRed.white.bold(' Suman fatal error ' + isBail +
        ' => making a graceful exit => ') + '\n' + chalk.red(String(err)) + '\n\n';

      const padded = str.split('\n').map(function (s) {
        return su.padWithXSpaces(3) + s;
      });

      const s = padded.join('\n');
      // do not delete the following console.error call, this is the primary logging mechanism for errors
      console.log('\n');
      console.error(s);
      return s;

    });

    if (singleProc && exitTestSuite) {
      //TODO: need to handle fatal errors in suman single process
      console.error(' => Suman single process and runtime uncaught exception or error in hook experienced.');
      // we should pass errors to emit() below, and the if the user wants to bail, they can.
      suman._sumanEvents.emit('suman-test-file-complete');
    }
    else if (exitTestSuite) {

      if (!suman.sumanCompleted) {

        // note: we need this check because on occasion errors occur in async code that don't get thrown
        // until after all boxes are checked in the system, we ignore the bad exit code in that case

        async.parallel([
            function (cb: Function) {
              const joined = big.join('\n');
              fatalRequestReply({
                type: constants.runner_message_type.FATAL,
                data: {
                  msg: joined,
                  error: joined
                }
              }, cb);
            },
            function (cb: Function) {
              // run all after.always hooks
              runAfterAlways(suman, cb);
            }
          ],
          function () {

            suman.logFinished(highestExitCode || 1, null, function (err: Error, val: any) {

              err && _suman.logError(su.getCleanErrorString(err));

              process.exit(highestExitCode || 1);
              // _suman.suiteResultEmitter.emit('suman-completed', val);
            });

          });
      }
    }
    else {
      if (cb) {
        process.nextTick(cb);
      }
      else {
        _suman.logError('suman implementation warning: no callback passed to graceful exit routine.');
      }

    }
  }
};
