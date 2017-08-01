'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');


//npm
import async = require('async');
import * as chalk from 'chalk';

//project
const _suman :IGlobalSumanObj = global.__suman = (global.__suman || {});
const p = path.resolve(process.env.HOME + '/.suman/global');

//////////////////////////////////////////////////////////////////////

export const run = function (deps: Array<string>): void {

  if (deps.length < 1) {
    console.log('\n');
    console.log(chalk.magenta(' => No dependency names passed at command line.'));
    console.log(' => Try this instead: "$ suman --install-globals <dep-name0> <dep-name1> <dep-nameX> "');
    return process.exit(1);
  }

  async.mapSeries(deps, function (d: string, cb: Function) {

    console.log('\n');
    console.log(' => Suman is now installing the following global dep => ', d);

    const k = cp.spawn('bash', [], {
      cwd: p
    });

    k.stdout.pipe(process.stdout);
    k.stderr.pipe(process.stderr);

    k.once('close', function (code: number) {
      cb(undefined, {
        name: d,
        code
      });
    });

    const cmd = `npm install -S ${d} --only=production`;

    k.stdin.write('\n' + cmd + '\n');
    k.stdin.end();

  }, function (err: Error, results: Array<Object>) {

    if (err) {
      return console.error(err);
    }

    console.log('\n');
    console.log('=> Suman installation results:');
    console.log('\n');

    let allGood = true;

    results.forEach(function (r) {
      console.log(r);
      if (r.code > 0) {
        allGood = false;
        console.log(' => ', r.name, 'may not have been installed successfully.');
      }
    });

    if (allGood) {
      console.log('\n');
      console.log(' => All deps installed successfully.');
      process.exit(0);
    }
    else {
      console.log('\n');
      console.log(' => Some deps may *not* have been installed successfully.');
      process.exit(1);
    }

  });

};
