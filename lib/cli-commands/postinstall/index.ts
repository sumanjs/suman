'use strict';
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as assert from 'assert';
import * as EE from 'events';
import * as cp from 'child_process';
import {ISumanOpts} from "../../../dts/global";


//npm
const colors = require('colors/safe');

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







