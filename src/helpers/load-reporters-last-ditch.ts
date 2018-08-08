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
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getClient} from '../index-helpers/socketio-child-client';
const rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();
const sumanReporters = _suman.sumanReporters = _suman.sumanReporters || [] as Array<string>;
const reporterRets = _suman.reporterRets = _suman.reporterRets || [];

//////////////////////////////////////////////////////////////////////////////////////////

let loaded = false;
let getReporterFn = function (fn: any) {
  return fn.default || fn.loadReporter || fn;
};

let loadReporter = function (rpath: string): Function {

  try {
    let fullPath;
    try{
     fullPath = require.resolve(rpath);
    }
    catch(err){
      fullPath = require.resolve(path.resolve(_suman.projectRoot + '/' + rpath));
    }

    let fn = require(fullPath);
    fn = getReporterFn(fn);
    assert(typeof fn === 'function', 'Suman implementation error - reporter module format fail.');
    fn.reporterPath = fullPath;
    return fn;
  }
  catch (err) {
    _suman.log.error(`could not load reporter at path "${rpath}".`);
    _suman.log.error(err.stack);
  }

};

export const run = function () {

  if (loaded) {
    return;
  }
  else {
    loaded = true;
  }
  
  const sumanOpts = _suman.sumanOpts;
  _suman.currentPaddingCount = _suman.currentPaddingCount || {val: 0};
  // we do not want the user to modify sumanOpts at runtime! so we copy it
  const optsCopy = Object.assign({}, sumanOpts);

  let fn: Function, client: SocketIOClient.Socket;

  if (sumanReporters.length < 1) {

    try {
      if (window) {
        if (window.__karma__) {
          _suman.log.info('Attempting to load karma reporter.');
          fn = loadReporter('suman-reporters/modules/karma-reporter');
        }
        else {
          _suman.log.info('Attempting to load websocket reporter.');
          fn = loadReporter('suman-reporters/modules/websocket-reporter');
          client = getClient();
        }
      }
    }
    catch (err) {
      if (su.vgt(7)) {
        // window is not defined message is likely here
        _suman.log.warning(chalk.yellow.bold(err.message));
      }

      if (_suman.inceptionLevel > 0 || sumanOpts.$useTAPOutput || sumanOpts.$useTAPJSONOutput || _suman.usingRunner) {
        su.vgt(6) && _suman.log.info('last-ditch effort to load a reporter: loading "tap-json-reporter"');
        fn = loadReporter('suman-reporters/modules/tap-json-reporter');
      }
      else {
        su.vgt(6) && _suman.log.info('last-ditch effort to load a reporter: loading "std-reporter"');
        fn = loadReporter('suman-reporters/modules/std-reporter');
      }
    }

    assert(typeof fn === 'function', 'Suman implementation error - reporter fail - ' +
      'reporter does not export a function. Please report this problem.');
    sumanReporters.push(fn.reporterPath);
    reporterRets.push(fn.call(null, rb, optsCopy, {}, client));
  }

};


