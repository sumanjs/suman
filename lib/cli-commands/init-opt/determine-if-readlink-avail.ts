'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const cp = require('child_process');
const os = require('os');
const path = require('path');

//npm
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../../config/suman-constants');
import su = require('suman-utils');

/////////////////////////////////////////////////////////////////////////////

export const determineIfReadlinkAvail = function (pkgDotJSON: Object, projectRoot: string) {

  return function whichReadlink(cb: Function) {

    cp.exec('which readlink', function (err: Error, stdout: string, stderr: string) {
      if (err || stderr) {
        cb(String((err.stack || err) + '\n' + stderr));
      }
      else if (String(stdout).indexOf(path.sep) > -1) {
        console.log(' => readlink utility is located here => ', chalk.green.bold(stdout));
        cb(null);
      }
      else {
        console.log('\n', chalk.red.bold(' => You will need to install a "readlink" utility on your machine. ' +
          'See: http://sumanjs.org/readlink.html'), '\n');
        cb(null);
      }
    });

  }

};






