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
import {runWatch} from 'suman-watch';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////

export const run = function (projectRoot: string, paths: Array<string>, sumanOpts: ISumanOpts, sumanConfig: ISumanConfig) {

  _suman.log('"--watch" option selected => Suman will watch files in your project, and run your tests on changes.');
  if (sumanOpts.verbosity > 2) {
    _suman.log('"--watch" option selected => Using the "watch" property object in your suman.conf.js file,' +
      'you can also configure Suman to do whatever you want based off a file change.');
  }

  runWatch(projectRoot, paths, sumanConfig, sumanOpts, function (err: Error) {
    if (err) {
      console.log('\n');
      console.error(err.stack || err);
      console.log('\n');
      process.exit(1);
    }
    else {
      console.log('\n');
      _suman.logInfo(chalk.underline('Suman watch successfully initialized.'));
    }
  })

};

