'use strict';

//ts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import os = require('os');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');


//npm
import semver = require('semver');
import chalk from 'chalk';

//project
const _suman :IGlobalSumanObj  = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');

//////////////////////////////////////////////////////////////

export const run  = function (cb?: Function) {

  console.log(' => NODE_PATH => ', process.env.NODE_PATH);
  let deps: Array<string> = [];

  Object.keys(constants.SUMAN_GLOBAL_DEPS).forEach(function (k) {
    deps = deps.concat(constants.SUMAN_GLOBAL_DEPS[k]);
  });

  let reinstallThese: Array<string> = [];

  deps.forEach(function (obj) {

    Object.keys(obj).forEach(function (k) {

      let version = obj[k];
      let resolved = false;
      try {
        console.log('Attempting to require => ', k);
        require.resolve(k);
        resolved = true;
        //TODO: compared installed version with version required by constants

      }
      catch (err) {
        console.log(err.stack || err);
        if (resolved === false) {
          let dep = {};
          dep[k] = version;
          reinstallThese.push(dep)
        }

      }
    });
  });

  console.log('\n');
  console.log(chalk.magenta(' => Suman diagnostics suggests the following deps need to be re-installed => '), '\n',
    reinstallThese);

  if (cb) {
    cb();
  }
  else {
    process.exit(0);
  }

};
