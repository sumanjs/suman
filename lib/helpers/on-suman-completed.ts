'use strict';

//typescript imports
import {ISuman} from "../../dts/suman";
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as util from 'util';
import domain = require('domain');
import path = require('path');
import assert = require('assert');
import EE = require('events');
import fs = require('fs');

//npm
const debug = require('suman-debug')('s:index');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});


/*////// what it do ///////////////////////////////////////////////


 */////////////////////////////////////////////////////////////////


export default function(suman: ISuman){

  return function _onSumanCompleted(code: number, msg: string) {

    const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
    suman.sumanCompleted = true;

    if (SUMAN_SINGLE_PROCESS) {
      suman._sumanEvents.emit('suman-test-file-complete');
    }
    else {

      suman.logFinished(code || 0, msg, function (err: Error | string, val: any) {  //TODO: val is not "any"

        if (_suman.sumanOpts.check_memory_usage) {
          let m = {
            heapTotal: _suman.maxMem.heapTotal / 1000000,
            heapUsed: _suman.maxMem.heapUsed / 1000000
          };
          process.stderr.write(' => Maximum memory usage during run => ' + util.inspect(m));
        }

        _suman.suiteResultEmitter.emit('suman-completed', val);
      });

    }
  };
}
