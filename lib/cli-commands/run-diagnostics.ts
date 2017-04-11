'use strict';

//core
const path = require('path');

//npm
const semver = require('semver');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../../config/suman-constants');

//////////////////////////////////////////////////////////////

export = function (cb?: Function) {

  console.log(' => NODE_PATH => ', process.env.NODE_PATH);

  let deps : Array<string> = [];

  Object.keys(constants.SUMAN_GLOBAL_DEPS).forEach(function (k) {
    deps = deps.concat(constants.SUMAN_GLOBAL_DEPS[k]);
  });

  let reinstallThese : Array<string> = [];

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
  console.log(colors.magenta(' => Suman diagnostics suggests the following deps need to be re-installed => '), '\n',
    reinstallThese);

  if (cb) {
    cb();
  }
  else {
    process.exit(0);
  }

};
