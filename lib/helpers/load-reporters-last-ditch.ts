'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

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
import {getClient} from '../index-helpers/socketio-child-client';
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const sumanReporters = _suman.sumanReporters = (_suman.sumanReporters || []);
const reporterRets = _suman.reporterRets = (_suman.reporterRets || []);

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
  // we do not want the user to modify sumanOpts at runtime! so we copy it
  const optsCopy = Object.assign({}, _suman.sumanOpts);

  let fn: Function, client: SocketIOClient.Socket;

  if (sumanReporters.length < 1) {

    try {
      if (window) {
        if(window.__karma___){
          fn = require('suman-reporters/modules/karma-reporter');
          fn = fn.default || fn;
        }
        else{
          fn = require('suman-reporters/modules/websocket-reporter');
          fn = fn.default || fn;
          client = getClient();
        }
      }
    }
    catch (err) {
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
    }

    console.log('\n');
    console.error('\n');
    assert(typeof fn === 'function', 'Suman implementation error - reporter fail - reporter does not export a function. Please report this problem on Github.');
    _suman.sumanReporters.push(fn);
    reporterRets.push(fn.call(null, resultBroadcaster, optsCopy, {}, client));
  }

};


