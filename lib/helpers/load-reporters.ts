'use strict';
import {ISumanConfig, ISumanOpts} from "../../dts/global";

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

//project
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
let loaded = false;

/////////////////////////////////////////////////////////////////////////////

export const loadReporters = function (sumanOpts: ISumanOpts, projectRoot: string, sumanConfig: ISumanConfig) {

  if (loaded) {
    return;
  }

  loaded = true;

  _suman.currentPaddingCount = _suman.currentPaddingCount || {};
  const optsCopy = Object.assign({}, sumanOpts);
  optsCopy.currPadCount = _suman.currentPaddingCount;

  const sumanReporters = _suman.sumanReporters = _.flattenDeep([sumanOpts.reporter_paths || []])
  .filter(v => {
    if (!v) {
      _suman.logWarning('a reporter path was undefined.');
    }
    return v;
  }).map(function (item: string) {
    if (!path.isAbsolute(item)) {
      item = path.resolve(projectRoot + '/' + item);
    }
    let fn;
    try {
      fn = require(item);
      fn = fn.default || fn;
      _suman.log(`loaded reporter with value "${item}"`);
      assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + item + '"');
      fn.pathToReporter = item;
    }
    catch (err) {
      throw new Error(chalk.red('Could not load reporter with name => "' + item + '"')
        + '\n => ' + (err.stack || err) + '\n');
    }
    return fn;
  });

  if (sumanOpts.reporters && !su.isObject(sumanConfig.reporters)) {
    throw new Error('You provided reporter names but have no reporters object in your suman.conf.js file.');
  }

  const reporterKV = sumanConfig.reporters || {};
  assert(su.isObject(reporterKV), '{suman.conf.js}.reporters property must be an object.');

  _.flattenDeep([sumanOpts.reporters || []]).filter(v => {
    if (!v) {
      _suman.logWarning('a reporter path was undefined.');
    }
    return v;
  })
  .forEach(function (item: string) {

    //TODO: check to see if paths of reporter paths clashes with paths from reporter names at command line (unlikely)

    let fn, val;

    if (!(item in reporterKV)) {

      try {
        fn = require(item);
        fn = fn.default || fn;
        _suman.log(`loaded reporter with value "${item}"`);
        assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + val + '"');
      }
      catch (err) {
        throw new Error(chalk.red('Could not load reporter with name => "' + item + '"')
          + '\n => ' + (err.stack || err) + '\n');
      }

    }
    else {
      val = reporterKV[item];
      if (!val) {
        throw new Error('no reporter with name = "' + item + '" in your suman.conf.js file.');
      }
      else {

        if (typeof val === 'string') {
          if (!path.isAbsolute(val)) {
            val = path.resolve(projectRoot + '/' + val);
          }
          fn = require(val);
        }
        else {
          fn = val;
        }
      }
    }

    try{
      fn = fn.default || fn;
      assert(typeof fn === 'function',
        'reporter module does not export a function, at path = "' + val + '"');
      fn.pathToReporter = val;  // val might not refer to a path...
      sumanReporters.push(fn);
    }
    catch(err){
      throw new Error(chalk.red('Could not load reporter with name => "' + item + '"')
        + '\n => ' + (err.stack || err) + '\n');
    }



  });

  if (process.env.SUMAN_INCEPTION_LEVEL > 0 || sumanOpts.$useTAPOutput) {
    _suman.log('TAP-JSON reporter loaded.');
    let fn = require('suman-reporters/modules/tap-json-reporter');
    fn = fn.default || fn;
    assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
    sumanReporters.push(fn);
    reporterRets.push(fn.call(null, resultBroadcaster, optsCopy, {}, su));
  }
  else {
    _suman.log('TAP reporter *not* loaded on the first pass-through.');
  }

  if (sumanReporters.length < 1) {
    if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
      _suman.log('Using native/std reporter');
      resultBroadcaster.emit(String(events.USING_STANDARD_REPORTER));
      let fn = require('suman-reporters/modules/std-reporter');
      fn = fn.default || fn;
      assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
      sumanReporters.push(fn);
    }
    else {
      _suman.log('TAP reporter loaded on second attempt.');
      let fn = require('suman-reporters/modules/tap-json-reporter');
      fn = fn.default || fn;
      assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
      sumanReporters.push(fn);
      reporterRets.push(fn.call(null, resultBroadcaster, optsCopy, {}, su));
    }
  }

  if (false) {
    try {
      sumanReporters.push(require('suman-sqlite-reporter'));
      resultBroadcaster.emit(String(events.USING_SQLITE_REPORTER));
      _suman.log('sqlite reporter was loaded.');
    }
    catch (err) {
      _suman.logError('failed to load "suman-sqlite-reporter".');
    }
  }

  if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
    sumanReporters.forEach(function (reporter) {
      reporterRets.push((reporter.default || reporter).call(null, resultBroadcaster, optsCopy, {}, su));
    });
  }

};


