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
import os = require('os');
import domain = require('domain');
import vm = require('vm');

//npm
import async = require('async');
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
import {shutdownProcess, handleSingleFileShutdown} from "./helpers/handle-suman-shutdown";

//////////////////////////////////////////////////////////////////////////

export const run = function (files: Array<string>) {

  let fileCount = chalk.bold.underline(String(files.length));
  let boldTitle = chalk.bold('single process mode');
  _suman.log.info(chalk.magenta(`Suman will run the following ${fileCount} files in ${boldTitle}:`));

  files.forEach(function (f, index) {
    // run this independently of the other for loop
    // since this is just for logging the path of the file
    _suman.log.info(`[${index+1}]`,chalk.gray(f[0]));
  });

  console.log(); //add a new line here

  files.forEach(function (f) {
    //load all the files, this helps users catch errors early
    // since we don't run any files until later, this makes it easier to catch early erros and debug
    require(f[0]);
  });


  const {tsq, tsrq, sumanOpts} = _suman;

  if(sumanOpts.dry_run){
    _suman.log.warning('Suman is using the "--dry-run" argument, and is shutting down without actually running the tests.');
    return shutdownProcess();
  }

  if (!_suman.sumanInitCalled) {
    throw new Error('Looks like none of your files contains a Suman test.');
  }

  tsq.drain = function () {
    if (tsrq.idle()) {
      _suman.log.verygood('We are done running all tests in single process mode.');
      shutdownProcess();
    }
  };

  _suman.log.good('Resuming test registration for Suman single process mode.');
  tsrq.resume();

};

export const run2 = function (files: Array<string>) {

  _suman.log.info(chalk.magenta('suman will run the following files in single process mode:'));
  _suman.log.info(util.inspect(files.map(v => v[0])));

  async.eachLimit(files, 5, function (f: string, cb: Function) {

      const fullPath = f[0];
      const shortenedPath = f[1];

      console.log('\n');
      _suman.log.info('is now running test with filename => "' + shortenedPath + '"', '\n');

      suiteResultEmitter.once('suman-test-file-complete', function () {
        cb(null);
      });

      require(fullPath); // load the test file

    },
    function (err: Error) {

      // TODO: SUMAN ONCE POST!!

      if (err) {
        console.error(err.stack || err || 'no error passed to error handler.');
        process.exit(1);
      }
      else {
        console.log('\n');
        _suman.log.info('SUMAN_SINGLE_PROCESS run is now complete.');
        console.log('\n');
        _suman.log.info('Time required for all tests in single process => ', Date.now() - _suman.sumanSingleProcessStartTime);

        process.exit(0);
      }

    });

};


