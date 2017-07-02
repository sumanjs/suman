'use strict';
import {IGlobalSumanObj} from "../../dts/global";


//core
const EE = require('events');
const assert = require('assert');

//npm


//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const sumanReporters = _suman.sumanReporters = (_suman.sumanReporters || []);

/////////////////////////////////////////////////////////

if (sumanReporters.length < 1) {

  let fn: Function;

  if (_suman.inceptionLevel > 0 || _suman.sumanOpts.useTAPOutput) {
    if (_suman.sumanOpts.verbosity > 4) {
      _suman.log('Using TAP reporter 1.');
    }
    _suman.log(' => Using TAP reporter 2.');
    fn = require('../reporters/tap-reporter');
  }
  else {
    _suman.log('Using std reporter.');
    fn = require('../reporters/std-reporter');
  }
  assert(typeof fn === 'function', 'Suman implementation error. Native reporter fail. Please report this problem.');
  _suman.sumanReporters.push(fn);
  fn.call(null, resultBroadcaster, _suman.sumanOpts);
}
