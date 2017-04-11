'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const util = require('util');

//npm
const su = require('suman-utils');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (configPath, opts) {

  const cwd = process.cwd();
  const projectRoot = _suman.projectRoot = (_suman.projectRoot || su.findProjectRoot(cwd));

  let sumanConfig, pth1, pth2;

  if (!(sumanConfig = _suman.sumanConfig)) {

    if (process.env.SUMAN_CONFIG) {
      sumanConfig = JSON.parse(process.env.SUMAN_CONFIG);

    }
    else {
      try {
        pth1 = path.resolve(path.normalize(cwd + '/' + configPath));
        sumanConfig = require(pth1); //TODO: allow for command line input of configPath
      }
      catch (err) {
        try {
          pth1 = null;  //force null for logging below
          pth2 = path.resolve(path.normalize(projectRoot + '/suman.conf.js'));
          sumanConfig = require(pth2);
        }
        catch (err) {
          pth2 = null;
          // throw new Error(' => Suman message => Warning - no configuration (suman.conf.js) ' +
          //   'found in the root of your project.\n  ' + colors.magenta(err.stack || err) + '\n');

          sumanConfig = _suman.sumanConfig = require('../default-conf-files/suman.default.conf');
          console.error(' => Suman warning => Using default configuration, please use suman --init to create a suman.conf.js file in the ' +
            'root of your project.');
        }
      }

      if (pth1 || pth2) {
        if (_suman.sumanOpts.verbosity > 8 || su.isSumanDebug()) {
          console.log(' => Suman verbose message => Path of suman config used: ' + (pth1 || pth2), '\n',
            'Value of suman config => ', util.inspect(sumanConfig));
        }
      }
    }

  }

  return _suman.sumanConfig = (_suman.sumanConfig || sumanConfig);
};
