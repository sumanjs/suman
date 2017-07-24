'use strict';
import {IGlobalSumanObj} from "../../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const os = require('os');
const fs = require('fs');

//npm
import * as chalk from 'chalk';
import async = require('async');
import su = require('suman-utils');
const mkdirp = require('mkdirp');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const run = function createTestFiles(paths : Array<string>) {

  const p = path.resolve(__dirname, '..', 'default-conf-files/suman.skeleton.js');
  const strm = fs.createReadStream(p);

  async.eachLimit(paths, 5, function (p: string, cb: Function) {

    mkdirp(path.dirname(p), function (err: Error) {
      if (err) {
        return cb(err);
      }

      strm.pipe(fs.createWriteStream(p, {flags: 'wx'}))
      .once('error', cb)
      .once('finish', function () {
        console.log('\n => File was created:', p);
        cb();
      });

    });

  }, function (err: Error) {
    console.log('\n');
    if (err) {
      console.error(chalk.red.bold(' => Suman error => ') + chalk.red(err.stack || err), '\n');
      process.exit(1);
    }
    else {
      console.log(chalk.blue.bold(' => Suman message => successfully created test skeleton(s).'));
      process.exit(0);
    }
  });

};
