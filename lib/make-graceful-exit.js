'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const colors = require('colors/safe');
const flattenDeep = require('lodash.flattendeep');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../config/suman-constants');
const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const sumanUtils = require('suman-utils');
const fatalRequestReply = require('./helpers/fatal-request-reply');
const debug = require('suman-debug')('s:graceful-exit');

/////////////////////////////////////////////////////////

const testErrors = _suman.testErrors = _suman.testErrors || [];
const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];

/////////////////////////////////////////////////////////////////////////////

module.exports = function (suman) {

  return function makeGracefulExitOrNot(errs, hook, cb) {

    const fst = _suman.sumanOpts.full_stack_traces;

    //TODO: may not need to pass hook in here anymore

    if (typeof cb !== 'function') {
      cb = function () {
        console.error(new Error(' => Callback fired, but callback was not passed to gracefulExit,' +
          'this is a implementation error => please report!'));
      };
    }

    let highestExitCode = 0;
    let exitTestSuite = false;

    errs = flattenDeep([errs]).filter(e => e);

    if (_suman.sumanUncaughtExceptionTriggered) {
      console.error(' => Suman runtime error => "UncaughtException triggered" => halting program.');
      if (errs.length) {
        errs.filter(e => e).forEach(function (e) {
          console.error(' => Suman message => Most likely unrelated error => Graceful exit error => ' +
            (e.stack || e));
        });
      }
      return;   // do not continue, return here
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
        return undefined; //explicit for your pleasure
      }
    }).map(function (err) {

      let sumanFatal = err.sumanFatal;
      let exitCode = err.sumanExitCode;

      if (exitCode > highestExitCode) {
        highestExitCode = exitCode;
      }

      let stack = String(err.stack || err).split('\n');

      stack.filter(function (item, index) {

        if (index < 4) {
          return true;
        }

        // if not full stack traces, then line needs to have one / char, and not node_modules
        if (fst) {
          return true;
        }

        if (String(item).match(/\//) && !String(item).match(/\/node_modules\//) && !String(item).match(/internal\/process\/next_tick.js/)) {
          return true;
        }

      }).map(function (item, index) {
        return item;
      });

      stack[0] = colors.bold(stack[0]);
      return stack.join('\n').concat('\n');

    }).map(function (err) {

      exitTestSuite = true;
      sumanRuntimeErrors.push(err);

      debug(' => Graceful exit error message => ', err);

      const isBail = _suman.sumanOpts.bail ? '(--bail option set to true)' : '';
      const str = '\n\u2691 ' +
        colors.bgRed.white.bold(' => Suman fatal error ' + isBail +
          ' => making a graceful exit => ') + '\n' + colors.red(err) + '\n\n';

      const s = str.split('\n').map(function (s) {
        return sumanUtils.padWithXSpaces(3) + s;
      }).join('\n');

      // do not delete the following console.error call, this is the primary logging mechanism for errors
      console.log('\n');
      console.error(s);
      return s;

    });

    if (singleProc && exitTestSuite) {
      //TODO: need to handle fatal errors in suman single process
      console.error(' => Suman single process and runtime uncaught exception or error in hook experienced.');
      suman._sumanEvents.emit('suman-test-file-complete');
    }
    else if (exitTestSuite) {

      if (!suman.sumanCompleted) {
        // note: we need this check because on occasion errors occur in async code that don't get thrown
        // until after all boxes are checked in the system, we ignore the bad exit code in that case

        const joined = big.join('\n');

        fatalRequestReply({
          type: constants.runner_message_type.FATAL,
          data: {
            msg: joined,
            error: joined
          }
        }, function () {

          debug('JOINED', '\n\n' + joined);

          suman.logFinished(highestExitCode || 1, null, function (err, val) {
            if (err) {
              console.error(new Error(err.stack || err));
            }
            _suman.suiteResultEmitter.emit('suman-completed', val);
          });

        });

      }
    }
    else {
      process.nextTick(cb);
    }
  }
};
