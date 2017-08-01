'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
import util = require('util');

//npm
import su = require('suman-utils');
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////////////////

export const loadSumanConfig = function (configPath: string, opts: Object) {

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
          //   'found in the root of your project.\n  ' + chalk.magenta(err.stack || err) + '\n');

          sumanConfig = _suman.sumanConfig = require('../default-conf-files/suman.default.conf');
          _suman.logError('warning => Using default configuration, ' +
            'please use "suman --init" to create a suman.conf.js file in the root of your project.');
        }
      }

      if (pth1 || pth2) {
        if (_suman.sumanOpts.verbosity > 8 || su.isSumanDebug()) {
          _suman.log('Path of suman config used: ' + (pth1 || pth2), '\n',
            'Value of suman config => ', util.inspect(sumanConfig));
        }
      }
    }

  }

  return _suman.sumanConfig = (_suman.sumanConfig || sumanConfig);
};
