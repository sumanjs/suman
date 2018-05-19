'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
_suman.shutdownEmitter = _suman.shutdownEmitter = (_suman.shutdownEmitter || new EE());

let maxMem = _suman.maxMem = {
  heapTotal: 0,
  heapUsed: 0
};

if (_suman.sumanConfig && _suman.sumanConfig.checkMemoryUsage) {

  const interval = setInterval(function () {

    const m = process.memoryUsage();
    if (m.heapTotal > maxMem.heapTotal) {
      maxMem.heapTotal = m.heapTotal;
    }
    if (m.heapUsed > maxMem.heapUsed) {
      maxMem.heapUsed = m.heapUsed;
    }

  }, 100);

  _suman.shutdownEmitter.once('closing', function () {
    clearInterval(interval);
  });

}
