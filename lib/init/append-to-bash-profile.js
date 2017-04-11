'use strict';

//core
const cp = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

//npm
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../../config/suman-constants');
const su = require('suman-utils');

/////////////////////////////////////////////////////////////////////////////

module.exports = function (data) {

  const pkgDotJSON = data.pkgDotJSON;
  const projectRoot = data.projectRoot;

  return function appendToBashProfile (cb) {
    if (true) {
      // => Note we probably will never alter bash profile or whatever, but this is here for placeholding
      process.nextTick(cb);
    }
    else {
      const bashProfileFile = path.resolve(su.getHomeDir() + '/.bash_profile');
      const cmd = 'export NODE_PATH=$(npm root -g):$NODE_PATH';
      fs.readFile(bashProfileFile, function (err, contents) {
        if (err) {
          cb(err);
        }
        else {
          if (String(contents).indexOf(cmd) < 0) {
            fs.appendFile(bashProfileFile, '\n\n' + cmd, cb);
          }
          else {
            cb(null);
          }
        }
      });
    }

  }

};












