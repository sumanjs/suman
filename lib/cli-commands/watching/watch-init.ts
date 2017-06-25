'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as util from 'util';
import * as assert from 'assert';
import * as path from 'path';
import * as EE from 'events';
import * as fs from 'fs';
import * as stream from 'stream';

//npm
import su from 'suman-utils';
const colors = require('colors/safe');
import {startWatching} from 'suman-watch';
import {ISumanConfig, ISumanOpts} from "../../../dts/global";

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////

export const run = function (sumanOpts: ISumanOpts, sumanConfig: ISumanConfig) {

  console.log(' => Suman message => --watch option selected => Suman will watch files in your project, and run your tests on changes.');
  if (_suman.sumanOpts.verbosity > 2) {
    console.log(' => Suman message => --watch option selected => Using the "watch" property object in your suman.conf.js file,' +
      'you can also configure Suman to do whatever you want based off a file change.');
  }

  let watchPer = null;

  if (sumanOpts.watch_per) {
    assert(su.isObject(sumanConfig.watch),
      colors.red(' => Suman usage error => suman.conf.js needs a "watch" property that is an object.'));

    assert(su.isObject(sumanConfig.watch.per),
      colors.red(' => Suman usage error => suman.conf.js "watch" object, needs property called "per" that is an object.'));

    watchPer = sumanConfig.watch.per[sumanOpts.watch_per];

    assert(su.isObject(watchPer),
      colors.red(` => Suman usage error => key/value for key ${sumanOpts.watch_per}, does not exist on {suman.conf.js}.watch.per.}`));
  }

  startWatching(Object.freeze({
      watchPer,
      noTranspile: sumanOpts.no_transpile,
      noRun: sumanOpts.no_run
    }),

    function (err: Error) {
      if (err) {
        console.error(err.stack || err);
        process.exit(1);
      }
      else {
        console.log(' => Suman watch successfully initialized.');
      }
    })

};

