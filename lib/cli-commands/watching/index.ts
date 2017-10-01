'use strict';

//dts
import {IGlobalSumanObj, ISumanConfig, ISumanOpts} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import assert = require('assert');
import path = require('path');
import EE = require('events');
import fs = require('fs');
import * as stream from 'stream';

//npm
import su from 'suman-utils';
import * as chalk from 'chalk';
import {run as runWatch} from 'suman-watch';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////

export const run = function (paths: Array<string>, sumanOpts: ISumanOpts, sumanConfig: ISumanConfig) {

  console.log(' => Suman message => --watch option selected => Suman will watch files in your project, and run your tests on changes.');
  if (_suman.sumanOpts.verbosity > 2) {
    console.log(' => Suman message => --watch option selected => Using the "watch" property object in your suman.conf.js file,' +
      'you can also configure Suman to do whatever you want based off a file change.');
  }

  let watchPer = null;

  if (sumanOpts.watch_per) {
    assert(su.isObject(sumanConfig.watch),
      chalk.red(' => Suman usage error => suman.conf.js needs a "watch" property that is an object.'));

    assert(su.isObject(sumanConfig.watch.per),
      chalk.red(' => Suman usage error => suman.conf.js "watch" object, needs property called "per" that is an object.'));

    watchPer = sumanConfig.watch.per[sumanOpts.watch_per];

    assert(su.isObject(watchPer),
      chalk.red(` => Suman usage error => key "${sumanOpts.watch_per}", 
      does not exist on the {suman.conf.js}.watch.per object.`));
  }

  const watchOpts = Object.freeze({
    paths,
    watchPer,
    noTranspile: sumanOpts.no_transpile,
    noRun: sumanOpts.no_run
  });

  runWatch(watchOpts, function (err: Error) {
    if (err) {
      console.log('\n');
      console.error(err.stack || err);
      process.exit(1);
    }
    else {
      console.log('\n');
      _suman.logInfo(chalk.underline('Suman watch successfully initialized.'));
    }
  })

};

