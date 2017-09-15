'use strict';

//dts
import {IGlobalSumanObj} from "../dts/global";

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
import os = require('os');
import domain = require('domain');
import vm = require('vm');

//npm
import async = require('async');
import chalk = require('chalk');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const {constants} = require('../config/suman-constants');
const {acquireDependencies} = require('./acquire-dependencies/acquire-pre-deps');
import su = require('suman-utils');


//////////////////////////////////

export const run = function (files: Array<string>) {

  _suman.log(chalk.magenta('suman will run the following files in single process mode:'));
  _suman.log(util.inspect(files.map(v => v[0])));

  async.eachLimit(files, 1, function (f: string, cb: Function) {

      const fullPath = f[0];
      const shortenedPath = f[1];

      console.log('\n');
      _suman.log('is now running testsuites for test filename => "' + shortenedPath + '"', '\n');

      require(fullPath);
      suiteResultEmitter.once('suman-test-file-complete', function () {
          cb(null);
      });

    },
    function (err: Error, results) {

      // TODO: SUMAN ONCE POST!!

      if (err) {
        console.error(err.stack || err || 'no error passed to error handler.');
        process.exit(1);
      }
      else {
        console.log('\n');
        _suman.log('SUMAN_SINGLE_PROCESS run is now complete.');
        console.log('\n');
        _suman.log('Time required for all tests in single process => ', Date.now() - _suman.sumanSingleProcessStartTime);

        process.exit(0);
      }

    });

};


