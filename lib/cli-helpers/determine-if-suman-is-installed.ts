'use strict';

import {ISumanConfig, ISumanOpts} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
const path = require('path');
const fs = require('fs');

//npm
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////////////////////

export const vetLocalInstallations = function (sumanConfig: ISumanConfig, opts: ISumanOpts, projectRoot: string) {

  let sumanInstalledLocally = false,
    sumanInstalledAtAll = false,
    sumanServerInstalled = false,
    sumanIsSymlinkedLocally = false;

  const sumanNodeModulesPath = path.resolve(projectRoot + '/node_modules/suman');

  try {
    if (fs.lstatSync(sumanNodeModulesPath).isSymbolicLink()) {
      sumanIsSymlinkedLocally = true;
    }
  }
  catch (err) {

  }

  try {
    require.resolve(sumanNodeModulesPath);
    sumanInstalledLocally = true;
  } catch (e) {
    sumanInstalledLocally = false;
  }

  if (sumanInstalledLocally) {
    if (opts.verbosity > 7) {  //only if user asks for verbose option
      _suman.log(chalk.blue('Suman appears to be installed locally.'));
    }
  }
  else {
    if (opts.verbosity > 2) {
      _suman.log(chalk.yellow('note that Suman is not installed locally, you may wish to run "$ suman --init"'));
    }
  }

  try {
    require.resolve('suman');
    sumanInstalledAtAll = true;
  } catch (e) {
    sumanInstalledAtAll = false;
  }

  if (sumanInstalledAtAll) {
    if (opts.verbosity > 7) {  //only if user asks for verbose option
      console.log(' ' + chalk.blue('=> Suman message => Suman appears to be installed locally.'));
    }
  }
  else {
    if (!sumanIsSymlinkedLocally && opts.verbosity > 2) {
      console.log(' ' + chalk.yellow('=> Suman message => note that Suman is not installed at all, you may wish to run "$ suman --init"'));
    }
  }

  try {
    require.resolve('suman-server');
    sumanServerInstalled = true;
  }
  catch (err) {
    sumanServerInstalled = false;
    if (opts.verbosity > 2) {
      _suman.log(chalk.yellow('note that "suman-server" package is not yet installed.'));
    }
  }

  return {
    sumanServerInstalled,
    sumanInstalledLocally,
    sumanInstalledAtAll
  }

};
