'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "../../dts/global";
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

///////////////////////////////////////////////////////////////////

const results: Array<ITableDataCallbackObj> = [];

suiteResultEmitter.on('suman-completed', function (obj: ITableDataCallbackObj) {

  counts.completedCount++;
  results.push(obj);

  console.error(chalk.red(`suman completed count ${counts.completedCount}`));

  if (counts.completedCount === counts.sumanCount) {

    let fn, resultz;

    if (_suman.usingRunner) {
      resultz = results.map(i => i.tableData);
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

      process.exit(highestExitCode, su.once(null, function (cb: Function) {

        if (_suman.isStrmDrained) {
          _suman.log('stream is already drained.');
          process.nextTick(cb);
        }
        else {

          let to = setTimeout(cb, 100);
          _suman.drainCallback = function (logpath: string) {
            clearTimeout(to);
            _suman.logWarning('Drain callback was indeed called.');
            try {
              fs.appendFileSync(logpath, 'Drain callback was indeed called.');
            }
            finally {
              process.nextTick(cb);
            }
          }
        }
      }));

    });

  }
  else if (counts.completedCount > counts.sumanCount) {
    throw new Error('Suman internal implementation error => completedCount should never be greater than sumanCount.');
  }

});
