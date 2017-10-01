'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";
import {ITableDataCallbackObj} from "../suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import EE = require('events');
import fs = require('fs');

//npm
import {events} from 'suman-events';
import su = require('suman-utils');
import chalk = require('chalk');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {handleRequestResponseWithRunner} from '../index-helpers/handle-runner-request-response';

const counts = require('./suman-counts');
import {oncePostFn} from './handle-suman-once-post';

const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const results: Array<ITableDataCallbackObj> = _suman.tableResults = (_suman.tableResults || []);

///////////////////////////////////////////////////////////////////

suiteResultEmitter.once('suman-test-file-complete', function () {

  debugger;

  let fn, resultz;

  if (_suman.usingRunner) {
    resultz = results.map(i => i.tableData);
    _suman.logError('handling request/response with runner.');
    fn = handleRequestResponseWithRunner(resultz);
  }
  else {

    // i may not be defined if testsuite (rootsuite) was skipped
    resultz = results.map(i => i ? i : null).filter(i => i);

    resultz.forEach(function (r) {
      resultBroadcaster.emit(String(events.STANDARD_TABLE), r.tableData, r.exitCode);
    });

    fn = oncePostFn;
  }

  const codes = results.map(i => i.exitCode);
  _suman.log(' => All "exit" codes from test suites => ', codes);

  const highestExitCode = Math.max.apply(null, codes);

  fn(function (err: IPseudoError) {

    err && _suman.logError(err.stack || err);
    // this is for testing expected test result counts
    resultBroadcaster.emit(String(events.META_TEST_ENDED));

    _suman.endLogStream && _suman.endLogStream();

    let waitForStdioToDrain = function (cb: Function) {

      if (_suman.isStrmDrained) {
        _suman.log('Log stream is already drained.');
        return process.nextTick(cb);
      }

      let timedout = false;
      let to = setTimeout(function () {
        timedout = true;
        _suman.logWarning('Drain callback timed out, exitting +.');
        cb(null);
      }, _suman.usingRunner ? 20 : 10);

      _suman.drainCallback = function (logpath: string) {
        clearTimeout(to);
        _suman.logWarning('Drain callback was actually called.');
        try {
          fs.appendFileSync(logpath, 'Drain callback was indeed called.');
        }
        finally {
          if (!timedout) {
            process.nextTick(cb);
          }
        }
      }
    };

    waitForStdioToDrain(function () {
      process.exit(highestExitCode)
    });

  });

});
