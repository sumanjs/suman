'use strict';

//dts
import {ISumanConfig, ISumanOpts, IGlobalSumanObj, ICurrentPaddingCount} from "suman-types/dts/global";
import {IRet} from "suman-types/dts/reporters";

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
import su = require('suman-utils');
import chalk from 'chalk';
import {events} from 'suman-events';
import * as _ from 'lodash';
import {constants} from "../config/suman-constants";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const reporterRets = _suman.reporterRets = _suman.reporterRets || [] as Array<IRet>;
const sr = _suman.sumanReporters = _suman.sumanReporters || [] as Array<string>; // should be unique set of paths loaded
let loaded = false;

/////////////////////////////////////////////////////////////////////////////

let getReporterFn = function (fn: any) {
  return fn.default || fn.loadReporter || fn;
};

////////////////////////////////////////////////////////////////////////////////////////

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

  const sumanReporterFns = [] as Array<Function>;

  let loadReporterFn = function (fn: Function, key: string): boolean {
    try {
      fn = getReporterFn(fn);
      assert(typeof fn === 'function', ' (Supposed) reporter module does meet the API requirements => ' + util.inspect(fn));
      sumanReporterFns.push(fn);
      return true;
    }
    catch (err) {
      key && _suman.log.warning(`Could not load reporter with key '${key}'.`);
      _suman.log.warning(err.message);
    }
  };

  let loadReporterViaPath = function (rpath: string): boolean {

    try {
      let fullPath;
      try {
        fullPath = require.resolve(rpath);
      }
      catch (err) {
        fullPath = require.resolve(path.resolve(projectRoot + '/' + rpath));
      }

      let fn = require(fullPath);
      fn = getReporterFn(fn);
      assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + rpath + '"');
      fn.reporterPath = fullPath;
      sumanReporterFns.push(fn);
      return true;
    }
    catch (err) {
      _suman.log.error(`could not load reporter at path "${rpath}".`);
      _suman.log.error(err.stack);
    }
  };

  su.flattenDeep([sumanOpts.reporter_paths || []]).filter(v => {
    !v && _suman.log.warning('warning: a supposed filesystem path to a reporter was falsy.');
    return v;
  })
  .forEach(function (item: string) {
    if (!path.isAbsolute(item)) (item = path.resolve(projectRoot + '/' + item));
    loadReporterViaPath(item);
  });

  if (sumanOpts.reporters && !su.isObject(sumanConfig.reporters)) {
    throw new Error('You provided reporter names but have no "reporters" object property in your <suman.conf.js> file.');
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

  su.flattenDeep([sumanOpts.reporters || []]).filter(v => {
    !v && _suman.log.warning('a reporter path was falsy, it must be ignored.');
    return v;
  })
  .forEach(function (item: string) {

    let val;
    if (item in reporterKV) {
      val = reporterKV[item];
      if (val && typeof val === 'string') {
        loadReporterViaPath(val);
      }
      else if (val && typeof val === 'function') {
        loadReporterFn(val, item);
      }
      else {
        val = val ? ' The bad value is: ' + util.inspect(val) : '';
        _suman.log.warning(`No acceptable value in reporters.map for key: '${item}'.${val}`)
      }
    }
    else {
      if (!loadReporterViaPath(item)) {
        // note: if the above load command fails, then we try the below
        let p = path.resolve('/suman-reporters/modules/' + item).substr(1);  // remove first "/" char
        loadReporterViaPath(p);
      }
    }
  });

  if (process.env.SUMAN_INCEPTION_LEVEL > 0 || sumanOpts.$useTAPOutput || sumanOpts.$useTAPJSONOutput) {

    if (sumanOpts.$useTAPOutput) {
      _suman.log.info('TAP reporter loaded.');
      loadReporterViaPath('suman-reporters/modules/tap-reporter');
    }
    else {
      // default is to use TAP-JSON not the TAP reporter
      _suman.log.info('TAP-JSON reporter loaded.');
      loadReporterViaPath('suman-reporters/modules/tap-json-reporter');
    }
  }
  else {
    _suman.log.info('TAP / TAP-JSON reporter not loaded on the first pass-through.');
  }

  if (sumanReporterFns.length < 1) {
    if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
      _suman.log.info('Using native/std reporter');
      rb.emit(String(events.USING_STANDARD_REPORTER));
      loadReporterViaPath('suman-reporters/modules/std-reporter');
    }
    else {
      _suman.log.info('TAP reporter loaded on second attempt.');
      loadReporterViaPath('suman-reporters/modules/tap-json-reporter');
    }
  }

  sumanReporterFns.forEach(function (fn) {
    const reporterPath = fn.reporterPath;
    sr.push(reporterPath);
    reporterRets.push(fn.call(null, rb, optsCopy, {}));
    su.vgt(5) && reporterPath && _suman.log.info(`Loaded reporter with path: "${reporterPath}"`);
  });

};


