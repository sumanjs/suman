'use strict';

//tsc
import {ISuman} from "../../dts/suman";
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import domain = require('domain');
import path = require('path');
import assert = require('assert');
import EE = require('events');
import fs = require('fs');

//npm
const debug = require('suman-debug')('s:index');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';

/*////// what it do ///////////////////////////////////////////////


 */////////////////////////////////////////////////////////////////

export default function (suman: ISuman) {

  return function onSumanCompleted(code: number, msg: string) {

    suman.sumanCompleted = true;

    setImmediate(function () {

      suman.logFinished(code || 0, msg, function (err: Error | string, val: any) {

        //TODO: val is not "any"

        if (_suman.sumanOpts.check_memory_usage) {
          _suman.logError('Maximum memory usage during run => ' + util.inspect({
            heapTotal: _suman.maxMem.heapTotal / 1000000,
            heapUsed: _suman.maxMem.heapUsed / 1000000
          }));
        }

        suiteResultEmitter.emit('suman-completed', val);
      });

    });

  };
}
