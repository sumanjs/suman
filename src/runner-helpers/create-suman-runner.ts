'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import os = require('os');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const cwd = process.cwd();
import {initializeSocketServer} from './socketio-server';
const runnerDebugLogPath = _suman.sumanRunnerStderrStreamPath =
  path.resolve(_suman.sumanHelperDirRoot + '/logs/runner-debug.log');

////////////////////////////////////////////////////////////////////////////

export const run = function (obj: Object) {

  const runObj = obj.runObj;
  const strm = _suman.sumanStderrStream = fs.createWriteStream(runnerDebugLogPath);

  strm.write('\n\n### Suman runner start ###\n\n');
  strm.write('Beginning of run at ' + Date.now() + ' = [' + new Date() + ']' + '\n');
  strm.write('Suman command issued from the following directory "' + cwd + '"\n');
  strm.write('Suman "process.argv" => \n' + util.inspect(process.argv) + '\n');

  /////////////// validate suman.once.js //////////////////////////////////////////////////////////

  const oncePath = path.resolve(_suman.sumanHelperDirRoot + '/suman.once.pre.js');

  let runOnce: Function;

  try {
    runOnce = require(oncePath);
    assert(typeof runOnce === 'function', 'runOnce is not a function.');
  }
  catch (err) {
    if (err instanceof assert.AssertionError) {
      console.error('Your suman.once.js module is defined at the root of your project,\n' +
        'but it does not export a function and/or return an object from that function.');
      throw err;
    }
  }

  runOnce = runOnce || function () {return { dependencies:{}};};

  ////////////// validate suman.order.js ///////////////////////////////////////////////////////////
  const orderPath = path.resolve(_suman.sumanHelperDirRoot + '/suman.order.js');

  let fn, order = null;

  try {
    fn = require(orderPath);
    if (fn) {
      order = fn();
    }
  }
  catch (err) {
    if (fn) {
      throw new Error(' => Your suman.order.js file needs to export a function.');
    }
    else if (!_suman.usingDefaultConfig || su.isSumanDebug()) {
      _suman.log.warning(chalk.magenta('warning => Your suman.order.js file could not be located,' +
          ' given the following path to your "<suman-helpers-dir>" => ') +
        '\n' + chalk.bgBlack.cyan(_suman.sumanHelperDirRoot));
    }
  }

  if (order) {
    //will throw error if invalid, halting the program
    require('./validate-suman.order.js').run(order);
  }

  ///////////////////////////////////////////////////////////////////////////////////////

  initializeSocketServer(function(err: Error, port: number){
    assert(Number.isInteger(port), 'port must be an integer');
    _suman.socketServerPort = port;
    require('./runner').run(runObj, runOnce, order);
  });


};
