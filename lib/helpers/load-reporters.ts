'use strict';

//dts
import {ISumanConfig, ISumanOpts, IGlobalSumanObj, ICurrentPaddingCount} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
import su from 'suman-utils';
import * as chalk from 'chalk';
import {events} from 'suman-events';
import * as _ from 'lodash';
import {constants} from "../../config/suman-constants";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
let loaded = false;

/////////////////////////////////////////////////////////////////////////////

export const loadReporters = function (sumanOpts: ISumanOpts, projectRoot: string, sumanConfig: ISumanConfig) {

  if (loaded) {
    _suman.log.warning('Suman implementation warning, "load-reporters" routine called more than once.');
    return;
  }

  loaded = true;
  _suman.currentPaddingCount = _suman.currentPaddingCount || {} as ICurrentPaddingCount;
  const optsCopy = JSON.parse(su.customStringify(sumanOpts));

  const onReporterLoadFail = function (err: Error, item: string) {
    let msg = chalk.red('Could not load reporter with name => "' + item + '"');
    _suman.log.error(new Error(msg).stack + '\n\n' + err.stack);
    process.exit(constants.EXIT_CODES.COULD_NOT_LOAD_A_REPORTER);
  };

  const sr = _suman.sumanReporters = _.flattenDeep([sumanOpts.reporter_paths || []])
  .filter(v => {
    !v && _suman.log.warning('warning: a supposed filesystem path to a reporter was null or undefined.');
    return v;
  })
  .map(function (item: string) {

    if (!path.isAbsolute(item)) {
      item = path.resolve(projectRoot + '/' + item);
    }

    let fn;
    try {
      fn = require(item);
      fn = fn.default || fn;
      assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + item + '"');
      fn.pathToReporter = item;
    }
    catch (err) {
      throw new Error(chalk.red('Could not load reporter with name => "' + item + '"') + `\n =>  ${err.stack || err} \n`);
    }
    return fn;
  });

  if (sumanOpts.reporters && !su.isObject(sumanConfig.reporters)) {
    throw new Error('You provided reporter names but have no reporters object in your suman.conf.js file.');
  }

  let reporterKV: any;

  try {
    reporterKV = sumanConfig.reporters.map;
    assert(su.isObject(reporterKV), '{suman.conf.js}.reporters property must be an object.');
  }
  catch (err) {
    _suman.log.warning('could not load reporters map via suman.conf.js.');
    reporterKV = {};
  }

  _.flattenDeep([sumanOpts.reporters || []]).filter(v => {
    if (!v) _suman.log.warning('a reporter path was undefined.');
    return v;
  })
  .forEach(function (item: string) {

    let fn, val;

    if (item in reporterKV) {
      val = reporterKV[item];
      if (val && typeof val === 'string') {
        try {
          fn = require(val);
        }
        catch (err) {
          try {
            fn = require(path.resolve(projectRoot + '/' + val));
          }
          catch (err) {
            onReporterLoadFail(err, item);
          }
        }
      }
      else if (val) {
        fn = val;
      }
      else {
        throw new Error('no reporter with name = "' + item + '" in your suman.conf.js file.');
      }
    }
    else {
      try {
        fn = require(item);
      }
      catch (err) {
        try {
          let p = path.resolve('/suman-reporters/modules/' + item).substr(1);  // remove first "/" char
          fn = require(p);
        }
        catch (err) {
          onReporterLoadFail(err, item);
        }
      }
    }

    try {
      fn = fn.default || fn;
      assert(typeof fn === 'function', 'reporter module does not export a function, at path = "' + val + '"');
      fn.pathToReporter = item;  // val might not refer to a path...
      sr.push(fn);
    }
    catch (err) {
      throw new Error(chalk.red('Could not load reporter with name => "' + item + '"') + `\n => ${err.stack || err}\n`);
    }

  });

  if (process.env.SUMAN_INCEPTION_LEVEL > 0 || sumanOpts.$useTAPOutput) {
    _suman.log.info('TAP-JSON reporter loaded.');
    let fn = require('suman-reporters/modules/tap-json-reporter');
    fn = fn.default || fn;
    assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
    sr.push(fn);
  }
  else {
    _suman.log.info('TAP reporter *not* loaded on the first pass-through.');
  }

  if (sr.length < 1) {
    if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
      _suman.log.info('Using native/std reporter');
      rb.emit(String(events.USING_STANDARD_REPORTER));
      let reporterPath = 'suman-reporters/modules/std-reporter';
      let fn = require(reporterPath);
      fn = fn.default || fn;
      assert(typeof fn === 'function', 'Suman implementation error - reporter module format failure.');
      fn.pathToReporter = reporterPath;
      sr.push(fn);
    }
    else {
      _suman.log.info('TAP reporter loaded on second attempt.');
      let reporterPath = 'suman-reporters/modules/tap-json-reporter';
      let fn = require(reporterPath);
      fn = fn.default || fn;
      assert(typeof fn === 'function', 'Suman implementation error - reporter module format fail.');
      fn.pathToReporter = reporterPath;
      sr.push(fn);
    }
  }

  sr.forEach(function (reporter) {
    let fn = reporter.default || reporter;
    let reporterPath = fn.pathToReporter;
    reporterRets.push(fn.call(null, rb, optsCopy, {}));
    reporterPath && _suman.log.info(`loaded reporter with path: "${reporterPath}"`);
  });

};


