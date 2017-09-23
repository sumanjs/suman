'use strict';
import {ISumanConfig, ISumanOpts} from "../../dts/global";

//polyfills
const global = require('suman-browser-polyfills/modules/global');
const process = require('suman-browser-polyfills/modules/process');

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});
import su = require('suman-utils');
const {constants} = require('../../config/suman-constants');

///////////////////////////////////////////////////////////////////

let loaded: any;

///////////////////////////////////////////////////////////////////

export const resolveSharedDirs = function (sumanConfig: ISumanConfig, projectRoot: string, sumanOpts: ISumanOpts) {

  if (loaded) {
    return loaded;
  }

  if (sumanOpts.init) {
    return loaded = {};
  }

  let sumanHelpersDir, shd;
  if (shd = sumanOpts.suman_helpers_dir) {
    sumanHelpersDir = (path.isAbsolute(shd) ? shd : path.resolve(projectRoot + '/' + shd));
  }
  else {
    sumanHelpersDir = path.resolve(projectRoot + '/' + (sumanConfig.sumanHelpersDir || 'suman'));
  }

  let sumanHelpersDirLocated = false;

  try {
    fs.statSync(sumanHelpersDir);
    sumanHelpersDirLocated = true;
  }
  catch (err) {
    console.error('\n\n', chalk.magenta('=> Suman could *not* locate your <suman-helpers-dir>; ' +
        'perhaps you need to update your suman.conf.js file, please see: ***'), '\n',
      chalk.cyan(' => http://sumanjs.org/conf.html'), '\n',
      ' => We expected to find your <suman-helpers-dir> here =>', '\n',
      chalk.bgBlack.cyan(sumanHelpersDir), '\n');

    console.log(' => Exiting because we could not locate the <suman-helpers-dir>, ' +
      'given your configuration and command line options.');
    return process.exit(constants.EXIT_CODES.COULD_NOT_LOCATE_SUMAN_HELPERS_DIR);
  }

  const logDir = path.resolve(sumanHelpersDir + '/logs');
  const integPrePath = path.resolve(sumanHelpersDir + '/suman.once.pre.js');
  const integPostPath = path.resolve(sumanHelpersDir + '/suman.once.post.js');

  //TODO possibly reconcile these with cmd line options
  const testSrcDirDefined = !!sumanConfig.testSrcDir; //TODO: check for valid string
  const testDir = process.env.TEST_DIR = _suman.testDir = path.resolve(projectRoot + '/' + (sumanConfig.testDir || 'test'));
  const testSrcDir = process.env.TEST_SRC_DIR = _suman.testSrcDir = path.resolve(projectRoot + '/' + (sumanConfig.testSrcDir || 'test'));
  const errStrmPath = path.resolve(sumanHelpersDir + '/logs/test-debug.log');
  const strmStdoutPath = path.resolve(sumanHelpersDir + '/logs/test-output.log');

  return loaded = Object.freeze({
    sumanHelpersDir: _suman.sumanHelperDirRoot = process.env.SUMAN_HELPERS_DIR_ROOT = sumanHelpersDir,
    sumanLogDir: _suman.sumanLogDir = logDir,
    integPrePath: _suman.integPrePath = integPrePath,
    integPostPath: _suman.integPostPath = integPostPath,
    sumanHelpersDirLocated: sumanHelpersDirLocated,
    testDebugLogPath: errStrmPath,
    testLogPath: strmStdoutPath
  });

};
