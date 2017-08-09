'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const cp = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

//npm
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../../config/suman-constants');
const su = require('suman-utils');

/////////////////////////////////////////////////////////////////////////////

export const makeAppendToBashProfile = function (pkgDotJSON: Object, projectRoot: string) {

  return function appendToBashProfile(cb: Function) {

    // => Note we probably will never alter bash profile or whatever, but this is here for placeholding/reminder
    return process.nextTick(cb);

    const bashProfileFile = path.resolve(su.getHomeDir() + '/.bash_profile');
    const cmd = 'export NODE_PATH=$(npm root -g):$NODE_PATH';
    fs.readFile(bashProfileFile, function (err: Error, contents: Buffer) {
      if (err) {
        return cb(err);
      }

      if (String(contents).indexOf(cmd) < 0) {
        fs.appendFile(bashProfileFile, '\n\n' + cmd, cb);
      }
      else {
        cb(null);
      }

    });

  }

};












