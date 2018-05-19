'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";
import {ITableDataCallbackObj} from "suman-types/dts/suman";

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
import async = require('async');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {handleRequestResponseWithRunner} from '../index-helpers/handle-runner-request-response';
import {oncePostFn} from './handle-suman-once-post';
import {makeHandleAsyncReporters} from './general';
import {getClient} from "../index-helpers/socketio-child-client";
const reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
const suiteResultEmitter = _suman.suiteResultEmitter = _suman.suiteResultEmitter || new EE();
const rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();
const results: Array<ITableDataCallbackObj> = _suman.tableResults = _suman.tableResults || [];

///////////////////////////////////////////////////////////////////

let isShutdown = false;
export const shutdownProcess = function () {

  if (isShutdown) {
    _suman.log.warning('implementation error, process shutdown has already commenced.');
    return;
  }

  isShutdown = true;
  let fn, resultz;

  if (_suman.usingRunner) {
    resultz = results.map(i => i.tableData);
    fn = handleRequestResponseWithRunner(resultz);
  }
  else if (_suman.inBrowser) {
    resultz = results.map(i => i.tableData);
    fn = handleRequestResponseWithRunner(resultz);
  }
  else {
    // i may not be defined if testsuite (rootsuite) was skipped
    resultz = results.filter(r => r);
    resultz.forEach(function (r) {
      rb.emit(String(events.STANDARD_TABLE), r.tableData, r.exitCode);
    });

    fn = oncePostFn;
  }

  const codes = results.map(i => i.exitCode);
  if (su.vgt(6)) {
    _suman.log.info(' => All "exit" codes from test suites => ', util.inspect(codes));
  }

  const highestExitCode = Math.max.apply(null, codes);

  fn(function (err: IPseudoError) {

    err && _suman.log.error(err.stack || err);
    // this is for testing expected test result counts
    rb.emit(String(events.META_TEST_ENDED));
    _suman.endLogStream && _suman.endLogStream();

    let waitForStdioToDrain = function (cb: Function) {

      if (_suman.inBrowser) {
        _suman.log.info('we are in browser no drain needed.');
        return process.nextTick(cb);
      }

      if (_suman.isStrmDrained) {
        _suman.log.info('Log stream is already drained.');
        return process.nextTick(cb);
      }

      let timedout = false;
      let timeout = _suman.usingRunner ? 20 : 10;

      let onTimeout = function () {
        timedout = true;
        cb(null);
      };

      let to = setTimeout(onTimeout, timeout);

      _suman.drainCallback = function (logpath: string) {
        clearTimeout(to);
        _suman.log.warning('Drain callback was actually called.');
        try {
          fs.appendFileSync(logpath, 'Drain callback was indeed called.');
        }
        finally {
          console.log('we are in finally...');
          if (!timedout) {
            console.log('finally has not timedout...');
            process.nextTick(cb);
          }
        }
      }
    };

    async.parallel({
        wait: waitForStdioToDrain,
        reporters: makeHandleAsyncReporters(reporterRets),
      },
      function (err, results) {

        const exitCode = String(results.reporters ? results.reporters.exitCode : '0');

        try {
          if (window && !window.__karma__) {
            const childId = window.__suman.SUMAN_CHILD_ID;
            const client = getClient();
            client.emit('BROWSER_FINISHED', {
                childId: childId,
                exitCode: exitCode,
                type: 'BROWSER_FINISHED',
              },
              function () {
                console.error('"BROWSER_FINISHED" message received by Suman runner.');
                console.error('If you can see this message, it is likely that the Suman runner was not able to close the browser process.');
              });
          }
        }
        catch (err) {
          process.exit(highestExitCode)
        }

      });

  });

};

export const handleSingleFileShutdown = function () {
  suiteResultEmitter.once('suman-test-file-complete', shutdownProcess);
};


