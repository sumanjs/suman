'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//core
import EE = require('events');
import assert = require('assert');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const sumanReporters = _suman.sumanReporters = (_suman.sumanReporters || []);

/////////////////////////////////////////////////////////

let loaded = false;

export const run = function () {

  if(loaded){
    return;
  }

  loaded = true;

  if (sumanReporters.length < 1) {
    let fn: Function;
    if (_suman.inceptionLevel > 0 || _suman.sumanOpts.useTAPOutput) {
      fn = require('../reporters/tap-reporter');
    }
    else {
      fn = require('../reporters/std-reporter');
    }
    assert(typeof fn === 'function', 'Suman implementation error. Native reporter fail. Please report this problem.');
    _suman.sumanReporters.push(fn);
    fn.call(null, resultBroadcaster, _suman.sumanOpts);
  }

};


