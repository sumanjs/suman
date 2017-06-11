'use strict';

import {ISumanConfig, ISumanOpts} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');

//npm
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////////////////////

export = function (sumanConfig: ISumanConfig, opts: ISumanOpts) {

  let err1, err2,
    projectRoot = _suman.projectRoot,
    sumanInstalledLocally = false,
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
    err1 = e;
  }
  finally {
    if (err1) {
      sumanInstalledLocally = false;
      if (opts.verbosity > 2) {
        console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed locally, you may wish to run "$ suman --init"'));
      }
    }
    else {
      if (opts.verbosity > 7) {  //only if user asks for verbose option
        console.log(' ' + colors.blue('=> Suman message => Suman appears to be installed locally.'));
      }
    }
  }

  try {
    require.resolve('suman');
    sumanInstalledAtAll = true;
  } catch (e) {
    err2 = e;
  }
  finally {
    if (err2) {
      sumanInstalledAtAll = false;
      if (!sumanIsSymlinkedLocally && opts.verbosity > 2) {
        console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed at all, you may wish to run "$ suman --init"'));
      }
    }
    else {
      if (opts.verbosity > 7) {  //only if user asks for verbose option
        console.log(' ' + colors.blue('=> Suman message => Suman appears to be installed locally.'));
      }
    }
  }

  try {
    // require.resolve(projectRoot + '/node_modules/suman-server');
    // suman-server should be located in ~/.suman/node_modules
    require.resolve('suman-server');
    sumanServerInstalled = true;
  }
  catch (err) {
    sumanServerInstalled = false;
    if (opts.verbosity > 2) {
      console.log(' ' + colors.yellow('=> Suman verbose message => note that "suman-server" package is not yet installed.'));
    }
  }

  return {
    sumanServerInstalled: sumanServerInstalled,
    sumanInstalledLocally: sumanInstalledLocally,
    sumanInstalledAtAll: sumanInstalledAtAll
  }

};
