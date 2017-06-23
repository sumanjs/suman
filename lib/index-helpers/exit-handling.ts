
//typescript imports
import {IGlobalSumanObj, SumanErrorRace} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {fatalRequestReply} = require('../helpers/fatal-request-reply');
import {constants} from '../../config/suman-constants';
import oncePostFn from '../helpers/handle-suman-once-post';
import {runAfterAlways} from '../helpers/run-after-always';
const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
const weAreDebugging = require('../helpers/we-are-debugging');

///////////////////////////////////////////////////////////////////////////////////////

let sigintCount = 0;

process.on('SIGINT', function () {

  sigintCount++;

  console.log('\n');
  _suman.logError(colors.red('SIGINT signal caught by suman process.'));
  console.log('\n');

  if (sigintCount === 2) {
    process.exit(1);
  }
  else if (sigintCount === 1) {
    shutdownSuman('SIGINT');
  }

});

let sigtermCount = 0;

process.on('SIGTERM', function () {

  sigtermCount++;

  console.log('\n');
  _suman.logError(colors.red('SIGTERM signal caught by suman process.'));
  console.log('\n');

  if (sigtermCount === 2) {
    process.exit(1);
  }
  else if (sigtermCount === 1) {
    shutdownSuman('SIGINT');
  }

});

const shutdownSuman = function (msg: string) {
  async.parallel([
    function (cb: Function) {
      async.series([
        function (cb: Function) {
          if (runAfterAlways && _suman.whichSuman) {
            runAfterAlways(_suman.whichSuman, cb);
          }
          else {
            process.nextTick(cb);
          }
        },

        function (cb: Function) {
          if (oncePostFn) {
            oncePostFn(cb);
          }
          else {
            console.error(' => Suman internal warning, oncePostFn not yet defined.');
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
};

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

  if (!err || typeof err !== 'object') {
    console.log(colors.bgMagenta.black(' => Error is not an object => ', util.inspect(err)));
    err = {stack: typeof err === 'string' ? err : util.inspect(err)}
  }

  if (err._alreadyHandledBySuman) {
    console.error(' => Error already handled => \n', (err.stack || err));
    return;
  }
  else {
    err._alreadyHandledBySuman = true;
  }

  sumanRuntimeErrors.push(err);

  if (_suman.afterAlwaysEngaged) {
    return;
  }

  setTimeout(function () {

    let msg = err.stack || err;

    if (typeof msg !== 'string') {
      msg = util.inspect(msg);
    }

    console.error('\n\n', colors.magenta(' => Suman uncaught exception => \n' + msg));

    if (String(msg).match(/suite is not a function/i)) {
      process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
        '\n\tsee sumanjs.org\n\n');
    }
    else if (String(msg).match(/describe is not a function/i)) {
      process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
        '\n\tsee sumanjs.org\n\n');
    }

    if (!_suman.sumanOpts || (_suman.sumanOpts && _suman.sumanOpts.ignoreUncaughtExceptions !== false)) {
      _suman.sumanUncaughtExceptionTriggered = true;
      console.error('\n\n', ' => Given uncaught exception,' +
        ' Suman will now run suman.once.post.js shutdown hooks...');
      console.error('\n\n', ' ( => TO IGNORE UNCAUGHT EXCEPTIONS AND CONTINUE WITH YOUR TEST(S), use ' +
        'the "--ignore-uncaught-exceptions" option.)');

      shutdownSuman(String(msg));

    }

  }, 400);

});

process.on('unhandledRejection', (reason: any, p: Promise<any>) => {
  reason = (reason.stack || reason);

  console.error('\n\nUnhandled Rejection at: Promise ', p, '\n\n=> Rejection reason => ', reason, '\n\n=> stack =>', reason);

  if (!_suman.sumanOpts || (_suman.sumanOpts && _suman.sumanOpts.ignoreUncaughtExceptions !== false)) {
    _suman.sumanUncaughtExceptionTriggered = true;

    // Should call graceful exit

    fatalRequestReply({
      type: constants.runner_message_type.FATAL,
      data: {
        error: reason,
        msg: reason
      }
    }, function () {
      process.exit(53); //have to hard-code in case suman-constants file is not loaded
    });
  }
});
