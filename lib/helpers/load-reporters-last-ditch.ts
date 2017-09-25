'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const sumanReporters = _suman.sumanReporters = (_suman.sumanReporters || []);

/////////////////////////////////////////////////////////

let loaded = false;

export const run = function () {

  if (loaded) {
    return;
  }
  else {
    loaded = true;
  }

  _suman.currentPaddingCount = _suman.currentPaddingCount || {};
  const optsCopy = Object.assign({}, _suman.sumanOpts);
  // we do not want the user to modify sumanOpts at runtime! so we copy it
  optsCopy.currPadCount = _suman.currentPaddingCount;

  if (sumanReporters.length < 1) {
    let fn: Function;

    if (_suman.inceptionLevel > 0 || _suman.sumanOpts.$useTAPOutput || _suman.usingRunner) {
      _suman.log('last-ditch effort to load a reporter: loading tap-json reporter');
      fn = require('suman-reporters/modules/tap-json-reporter');
      fn = fn.default || fn;
    }
    else {
      _suman.log('last-ditch effort to load a reporter: loading std reporter');
      fn = require('suman-reporters/modules/std-reporter');
      fn = fn.default || fn;
    }

    console.log('\n');
    console.error('\n');
    assert(typeof fn === 'function', 'Suman implementation error - reporter fail. Please report this problem on Github.');
    _suman.sumanReporters.push(fn);
    fn.call(null, resultBroadcaster, optsCopy, {}, su);
  }

};


