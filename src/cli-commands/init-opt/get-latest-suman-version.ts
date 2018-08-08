'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import cp = require('child_process');
import os = require('os');
import path = require('path');

//npm
import chalk from 'chalk';
import async = require('async');
import Timer = NodeJS.Timer;

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////

export const makeGetLatestSumanVersion = function (pkgDotJSON: Object, projectRoot: string) {

  return function getLatestSumanVersion(cb: Function) {

    async.race([
      function (cb: Function) {
        setTimeout(cb, 2800)
      },
      function (cb: Function) {

        cp.exec('npm view suman version', function (err: Error, stdout: string, stderr: string) {

          console.log('\n');

          if (err || String(stdout).match(/error/i) || String(stderr).match(/error/)) {
            return cb(null, {
              error: err,
              stderr,
              stdout
            });
          }

          _suman.log.info(chalk.cyan('Newest Suman version in the NPM registry:'), String(stdout).replace('\n', ''));
          if (pkgDotJSON) {
            _suman.log.info(chalk.cyan('Locally installed Suman version:'), pkgDotJSON.version);
          }

          cb(null);

        });
      }

    ], cb)

  }

};


