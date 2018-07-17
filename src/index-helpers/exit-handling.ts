'use strict';

//dts
import {IGlobalSumanObj, IPromiseWithDomain, ISumanDomain, SumanErrorRace} from "suman-types/dts/global";
import {Dictionary, AsyncResultArrayCallback} from "async";
type AsyncFuncType = AsyncResultArrayCallback<Dictionary<any>, Error>;

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import Domain = require('domain');

//npm
import * as async from 'async';
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {fatalRequestReply} from '../helpers/general';
import {constants} from '../config/suman-constants';
import {oncePostFn} from '../helpers/handle-suman-once-post';
import {runAfterAlways} from '../helpers/run-after-always';
const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
const weAreDebugging = su.weAreDebugging;

//////////////////////////////////////////////////////////////////////////////////////////////////////

const shutdownSuman = function (msg: string) {

  async.parallel([
    function (cb: AsyncFuncType) {
      async.series([
        function (cb: AsyncFuncType) {
          if (runAfterAlways && _suman.whichSuman) {
            runAfterAlways(_suman.whichSuman, cb);
          }
          else {
            process.nextTick(cb);
          }
        },

        function (cb: AsyncFuncType) {
          if (oncePostFn) {
            oncePostFn(cb);
          }
          else {
            _suman.log.error('Suman internal warning, "oncePostFn" routine not yet available.');
            process.nextTick(cb);
          }
        },
      ], cb);
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
    err && console.error('Error in exit handler => \n', err.stack || err);

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
};

///////////////////////////////////////////////////////////////////////////////////////////////////

let sigintCount = 0;

process.on('SIGINT', function () {

  debugger; // leave debugger statement here

  sigintCount++;
  console.log('\n');
  _suman.log.error(chalk.red('SIGINT signal caught by suman process.'));
  console.log('\n');

  if (sigintCount === 2) {
    process.exit(1);
  }
  else if (sigintCount === 1) {
    shutdownSuman('SIGINT received');
  }
});

let sigtermCount = 0;

process.on('SIGTERM', function () {

  debugger; // leave debugger statement here
  sigtermCount++;
  console.log('\n');
  _suman.log.error(chalk.red('SIGTERM signal caught by suman process.'));
  console.log('\n');

  if (sigtermCount === 2) {
    process.exit(1);
  }
  else if (sigtermCount === 1) {
    shutdownSuman('SIGTERM received');
  }

});

process.on('warning', function (w: Error) {
  if (weAreDebugging) {
    // if we are debugging, log all warnings
    console.error(w.stack || w);
  }
  else if (!(/deprecated/i.test(String(w)))) {
    // there were some really useless warnings about deprecation
    // if the user wants to see deprecation warnings...they can add their own process.on('warning') handler, k thx
    console.error(w.stack || w);
  }
});

// remove all pre-existing listeners
process.removeAllListeners('uncaughtException');
process.on('uncaughtException', function (err: SumanErrorRace) {

  debugger; // leave debugger statement here
  const sumanOpts = _suman.sumanOpts;

  if (!err) {
    err = new Error('falsy value passed to uncaught exception handler.');
  }

  if (typeof err !== 'object') {
    err = {
      name: 'uncaughtException',
      message: typeof err === 'string' ? err : util.inspect(err),
      stack: typeof err === 'string' ? err : util.inspect(err)
    }
  }

  if (err._alreadyHandledBySuman) {
    console.error(' => Error already handled => \n', (err.stack || err));
    return;
  }

  err._alreadyHandledBySuman = true;
  sumanRuntimeErrors.push(err);

  let avoidShutdown = false;

  let d;
  if (err && (d = err.domain)) {
    if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
      typeof err === 'object' && (err._alreadyHandledBySuman = true);
      d.emit('error', err);
      return;
    }
  }

  if (d = process.domain) {
    if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
      typeof err === 'object' && (err._alreadyHandledBySuman = true);
      d.emit('error', err);
      return;
    }
  }

  if (sumanOpts && sumanOpts.series) {
    if (d = _suman.activeDomain) {
      d.emit('error', err);
      return;
    }
  }

  if (_suman.afterAlwaysEngaged) {
    // we are running after always hooks, and any uncaught exceptions will be ignored in this case
    return;
  }

  try {
    process.domain && process.domain.exit();
  }
  catch (err) {
  }

  process.nextTick(function () {

    let d;

    if (d = process.domain) {
      if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
        avoidShutdown = true;
        typeof err === 'object' && (err._alreadyHandledBySuman = true);
        d.emit('error', err);
        return;
      }
    }

    if (d = Domain._stack && Domain._stack.pop()) {
      if (d.sumanTestCase || d.sumanEachHook || d.sumanAllHook) {
        avoidShutdown = true;
        typeof err === 'object' && (err._alreadyHandledBySuman = true);
        d.emit('error', err);
        return;
      }
    }
  });

  if (!sumanOpts || sumanOpts.ignoreUncaughtExceptions !== false) {

    _suman.uncaughtExceptionTriggered = err;

    setTimeout(function () {

      debugger; // leave debugger statement here

      if (avoidShutdown) {
        _suman.log.warning('suman avoided a shutdown, by catching the domain.');
        return;
      }

      let msg = err.stack || err;

      if (typeof msg !== 'string') {
        msg = util.inspect(msg);
      }

      console.error('\n');
      _suman.log.error(chalk.magenta.bold(' => Suman uncaught exception => \n', chalk.magenta(msg)), '\n');
      _suman.log.error('Given the event of an uncaught exception, Suman will now run "suman.once.post.js" shutdown hooks...');
      console.error('\n');
      _suman.log.error(' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
        'the "--ignore-uncaught-exceptions" option.)');

      shutdownSuman(msg);

    }, 200);

  }

});

// remove all pre-existing listeners
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', ($reason: any, p: IPromiseWithDomain) => {

  debugger; // leave it here thanks

  const sumanOpts = _suman.sumanOpts;
  const reason = $reason ? ($reason.stack || $reason) : new Error('no reason passed to "unhandledRejection" handler.');

  if (p && p.domain) {
    if (p.domain.sumanTestCase || p.domain.sumanEachHook || p.domain.sumanAllHook) {
      typeof reason === 'object' && (reason._alreadyHandledBySuman = true);
      p.domain.emit('error', reason);
      return;
    }
  }

  if (process.domain) {
    if (process.domain.sumanTestCase || process.domain.sumanEachHook || process.domain.sumanAllHook) {
      typeof reason === 'object' && ($reason._alreadyHandledBySuman = true);
      process.domain.emit('error', reason);
      return;
    }
  }

  if (sumanOpts && sumanOpts.series) {
    if (_suman.activeDomain) {
      _suman.activeDomain.emit('error', reason);
      return;
    }
  }

  console.error('\n');
  _suman.log.error(chalk.magenta.bold('Unhandled Rejection at Promise:'), chalk.magenta(util.inspect(p)));
  console.error('\n');
  _suman.log.error(chalk.magenta.bold('Rejection reason'), chalk.magenta(reason));
  console.error('\n');

  _suman.uncaughtExceptionTriggered = reason;

  if (_suman.afterAlwaysEngaged) {
    // we are running after always hooks, and any uncaught exceptions will be ignored in this case
    return;
  }

  if (!sumanOpts || sumanOpts.ignoreUncaughtExceptions !== false) {
    setTimeout(function () {
      shutdownSuman(reason);
    }, 200);
  }
});
