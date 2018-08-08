'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const os = require('os');
const fs = require('fs');

//npm
import chalk from 'chalk';
import async = require('async');
import su = require('suman-utils');
const mkdirp = require('mkdirp');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const run = function createTestFiles(paths: Array<string>) {

  const p = path.resolve(__dirname, '..', '..', 'default-conf-files/suman.skeleton.js');
  const strm = fs.createReadStream(p);

  console.log();

  async.eachLimit(paths, 5, function (p: string, cb: Function) {

      mkdirp(path.dirname(p), function (err: Error) {
        if (err) {
          return cb(err);
        }

        strm.pipe(fs.createWriteStream(p, {flags: 'wx'}))
        .once('error', cb)
        .once('finish', function () {
          _suman.log.good(` => File was created:  "${chalk.bold(p)}"`);
          cb(null);
        });

      });

    },

    function (err: Error) {

      console.log();

      if (err) {
        _suman.log.error(chalk.red.bold('There was an error creating at least one suman test skeleton:'));
        _suman.log.error(chalk.red(String(err.stack || err)));
        return process.exit(1);
      }

      _suman.log.verygood(chalk.green.bold(' => Suman message => successfully created test skeleton(s).'));
      process.exit(0);

    });

};
