'use strict';
import {IGlobalSumanObj, IPseudoError} from "../../dts/global";
import {ITableDataCallbackObj} from "../suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');
const EE = require('events');
const fs = require('fs');

//npm
import {events} from 'suman-events';
const su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const handleRequestResponseWithRunner = require('./handle-runner-request-response');
const counts = require('./suman-counts');
import oncePostFn from './handle-suman-once-post';
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

///////////////////////////////////////////////////////////////////

const results: Array<ITableDataCallbackObj> = [];

suiteResultEmitter.on('suman-completed', function (obj: ITableDataCallbackObj) {

  counts.completedCount++;
  results.push(obj);

  if (counts.completedCount === counts.sumanCount) {

    let fn;

    let resultz;

    if (_suman.usingRunner) {
      resultz = results.map(i => i.tableData);
      fn = handleRequestResponseWithRunner(resultz);
    }
    else {

      // i may not be defined if testsuite (rootsuite) was skipped
      resultz = results.map(i => i ? i.tableData : null).filter(i => i);

      resultz.forEach(function (table) {
        resultBroadcaster.emit(String(events.STANDARD_TABLE), table);
      });

      fn = oncePostFn;
    }

    const codes = results.map(i => i.exitCode);

    if (su.isSumanDebug()) {
      console.log(' => All "exit" codes from test suites => ', codes);
    }

    const highestExitCode = Math.max.apply(null, codes);

    fn(function (err: IPseudoError) {

      if (err) {
        console.error(err.stack || err);
      }

      process.exit(highestExitCode, function (cb: Function) {

        if (_suman.isStrmDrained) {
          console.log('Strm is already drained.');
          cb();
        }
        else {

          let to = setTimeout(function () {
            _suman.drainCallback = function () {
            };
            cb();
          }, 100);

          _suman.drainCallback = function (logpath: string) {
            clearTimeout(to);
            console.log(' => Drain callback called yes.');
            try {
              fs.appendFileSync(logpath, ' => Drain callback called yes.');
            }
            finally {
              cb();
            }
          }
        }

      });

    });

  }
  else if (counts.completedCount > counts.sumanCount) {
    throw new Error('=> Suman internal implementation error => ' +
      'completedCount should never be greater than sumanCount.');
  }

});
