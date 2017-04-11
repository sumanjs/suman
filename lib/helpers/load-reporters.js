'use strict';

//core
const path = require('path');
const util = require('util');
const assert = require('assert');

//npm
const colors = require('colors/safe');
const events = require('suman-events');

//project
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
let loaded = false;

/////////////////////////////////////////////////////////////////////////////

module.exports = function loadReporters (opts, projectRoot, sumanConfig) {

  if (loaded) {
    console.log(' => Suman implementation check => reporters already loaded.');
    return;
  }

  loaded = true;

  const sumanReporters = _suman.sumanReporters = (opts.reporter_paths || []).map(function (item) {
    if (!path.isAbsolute(item)) {
      item = path.resolve(projectRoot + '/' + item);
    }
    const fn = require(item);
    assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + item + '"');
    fn.pathToReporter = item;
    return fn;
  });

  if (opts.reporters && typeof sumanConfig.reporters !== 'object') {
    throw new Error(' => Suman fatal error => You provided reporter names but have no reporters object in your suman.conf.js file.');
  }

  const reporterKV = sumanConfig.reporters || {};

  (opts.reporters || []).forEach(function (item) {

    //TODO: check to see if paths of reporter paths clashes with paths from reporter names at command line (unlikely)

    let fn;

    if (!(item in reporterKV)) {

      try {
        fn = require(item);
        assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + val + '"');
      }
      catch (err) {
        throw new Error(colors.red(' => Suman fatal exception => Could not load reporter with name => "' + item + '"')
          + '\n => ' + (err.stack || err) + '\n');
      }

    }
    else {
      let val = reporterKV[item];
      if (!val) {
        throw new Error(' => Suman fatal error => no reporter with name = "' + item + '" in your suman.conf.js file.');
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

    assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + val + '"');
    fn.pathToReporter = val;  // val might not refer to a path...
    sumanReporters.push(fn);

  });

  if (sumanReporters.length < 1) {
    console.log(' => Using native/std reporter');
    resultBroadcaster.emit(String(events.USING_STANDARD_REPORTER));
    const fn = require('../reporters/std-reporter');
    assert(typeof fn === 'function', 'Suman native reporter fail.');
    sumanReporters.push(fn);
  }

  if(false){
    try{
      sumanReporters.push(require('suman-sqlite-reporter'));
      resultBroadcaster.emit(String(events.USING_SQLITE_REPORTER));
      console.log(' => Suman sqlite reporter was loaded.');
    }
    catch(err){
      console.error(' => Suman failed to load "suman-sqlite-reporter".');
    }
  }

  sumanReporters.forEach(function (reporter) {
    reporterRets.push(reporter.call(null, resultBroadcaster));
  });

};
