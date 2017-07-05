'use strict';
//ts
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as assert from 'assert';
import * as EE from 'events';
import * as cp from 'child_process';

//npm
import * as chalk from 'chalk';
const su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import runner from '../runner';
const cwd = process.cwd();

////////////////////////////////////////////////////////////////////////////

export const createRunner = function (obj: Object) {

  const runObj = obj.runObj;
  const strmPath = _suman.sumanRunnerStderrStreamPath = path.resolve(_suman.sumanHelperDirRoot + '/logs/runner-debug.log');
  const strm = _suman.sumanStderrStream = fs.createWriteStream(strmPath);

  strm.write('\n\n### Suman runner start ###\n\n');
  strm.write('Beginning of run at ' + Date.now() + ' = [' + new Date() + ']' + '\n');
  strm.write('Command issued from the following directory "' + cwd + '"\n');
  strm.write('Command = ' + JSON.stringify(process.argv) + '\n');

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

  runOnce = runOnce || function () {
      return {};
    };

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
      console.log(chalk.magenta(' => Suman warning => Your suman.order.js file could not be located,' +
          ' given the following path to your "<suman-helpers-dir>" => ') +
        '\n' + chalk.bgBlack.cyan(_suman.sumanHelperDirRoot));
    }
  }

  if (order) {
    //will throw error if invalid, halting the program
    require('./validate-suman.order.js').run(order);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  runner.findTestsAndRunThem(runObj, runOnce, order);

};
