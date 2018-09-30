'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

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
import {ISumanOpts} from "suman-types/dts/global";


//npm
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

///////////////////////////////////////////////////////////////////////////////

export const run = function(opts: ISumanOpts){

  const script = path.resolve(__dirname + '/../../scripts/suman-postinstall.sh');

  console.log('\n');
  console.log(' => Suman will run its postinstall routine.');
  console.log('\n');

  const k = cp.spawn(script);

  k.stdout.pipe(process.stdout);
  k.stderr.pipe(process.stderr);

  k.once('close', function (code: number) {
    process.exit(code || 0);
  });


};







