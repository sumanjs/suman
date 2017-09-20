//typescript imports
import {IGlobalSumanObj, SumanErrorRace} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import * as async from 'async';
import * as chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {fatalRequestReply} = require('../helpers/fatal-request-reply');
import {constants} from '../../config/suman-constants';
import {oncePostFn} from '../helpers/handle-suman-once-post';
import {runAfterAlways} from '../helpers/run-after-always';

const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
const weAreDebugging = require('../helpers/we-are-debugging');

///////////////////////////////////////////////////////////////////////////////////////

const shutdownSuman = function (msg: string) {

  async.parallel([
    function (cb: AsyncResultArrayCallback<Dictionary<any>, Error>) {
      async.series([
        function (cb: AsyncResultArrayCallback<Dictionary<any>, Error>) {
          if (runAfterAlways && _suman.whichSuman) {
            runAfterAlways(_suman.whichSuman, cb);
          }
          else {
            process.nextTick(cb);
          }
        },

        function (cb: AsyncResultArrayCallback<Dictionary<any>, Error>) {
          if (oncePostFn) {
            oncePostFn(cb);
          }
          else {
            _suman.logError('Suman internal warning, oncePostFn not yet defined.');
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

    if (err) {
      console.error('Error in exit handler => \n', err.stack || err);
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
};

///////////////////////////////////////////////////////////////////////////////////////////////////

let sigintCount = 0;

process.on('SIGINT', function () {

  sigintCount++;

  console.log('\n');
  _suman.logError(chalk.red('SIGINT signal caught by suman process.'));
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

  sigtermCount++;

  console.log('\n');
  _suman.logError(chalk.red('SIGTERM signal caught by suman process.'));
  console.log('\n');

  if (sigtermCount === 2) {
    process.exit(1);
  }
  else if (sigtermCount === 1) {
    shutdownSuman('SIGINT received');
  }

});

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

  if (_suman.afterAlwaysEngaged) {
    // we are running after always hooks, and any uncaught exceptions will be ignored in this case
    return;
  }

  if (!_suman.sumanOpts || _suman.sumanOpts.ignoreUncaughtExceptions !== false) {

    _suman.sumanUncaughtExceptionTriggered = err;

    setTimeout(function () {

      let msg = err.stack || err;

      if (typeof msg !== 'string') {
        msg = util.inspect(msg);
      }

      console.error('\n');
      console.error(chalk.magenta.bold(' => Suman uncaught exception => \n', chalk.magenta(msg)));
      _suman.logError('Given the event of an uncaught exception,' +
        ' Suman will now run "suman.once.post.js" shutdown hooks...');
      console.error('\n');
      _suman.logError(' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
        'the "--ignore-uncaught-exceptions" option.)');

      shutdownSuman(msg);

    }, 400);

  }

});

process.on('unhandledRejection', ($reason: any, p: Promise<any>) => {

  if (p && p.domain) {
    if (p.domain.itTestCase) {
      $reason && ($reason._alreadyHandledBySuman = true);
      p.domain.emit('error', $reason);
      return;
    }
  }

  //

  const reason = ($reason.stack || $reason);
  console.error('\n');
  _suman.logError(chalk.magenta.bold('Unhandled Rejection at Promise:'), chalk.magenta(util.inspect(p)));
  console.error('\n');
  _suman.logError(chalk.magenta.bold('Rejection reason'), chalk.magenta(reason));
  console.error('\n');

  _suman.sumanUncaughtExceptionTriggered = reason;

  if (_suman.afterAlwaysEngaged) {
    // we are running after always hooks, and any uncaught exceptions will be ignored in this case
    return;
  }

  if (_suman.sumanOpts || _suman.sumanOpts.ignoreUncaughtExceptions !== false) {
    setTimeout(function () {
      shutdownSuman(reason);
    }, 400);
  }
});
