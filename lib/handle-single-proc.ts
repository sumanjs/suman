'use strict';

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

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');
const {acquireDependencies} = require('./acquire-dependencies/acquire-pre-deps');
import su = require('suman-utils');

//////////////////////////////////

export const run = function (files: Array<string>) {

  async.eachLimit(files, 1, function (f: string, cb: Function) {

      const fullPath = f[0];
      const shortenedPath = f[1];

      console.log('\n');
      _suman.log('is now running testsuites for test filename => "' + shortenedPath + '"', '\n');

      let callable = true;
      const first = function () {
        if (callable) {
          callable = false;
          cb.apply(null, arguments);
        }
        else {
          _suman.logError('warning => SUMAN_SINGLE_PROCESS callback fired more than once, ' +
            'here is the data passed to callback => ', util.inspect(arguments));
        }
      };

      const exportEvents = require(fullPath);
      const counts = exportEvents.counts;
      let currentCount = 0;

      exportEvents
      .on('suman-test-file-complete', function () {
        currentCount++;
        if (currentCount === counts.sumanCount) {
          process.nextTick(function () {
            exportEvents.removeAllListeners();
            first(null);
          });
        }
        else if (currentCount > counts.sumanCount) {
          throw new Error(' => Count should never be greater than expected count.');
        }

      })
      .on('test', function (test) {
        test.call(null);
      })
      .once('error', function (e) {
        console.log(e.stack || e || 'no error passed to error handler.');
        first(e);
      });

    },
    function (err, results) {

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

}


