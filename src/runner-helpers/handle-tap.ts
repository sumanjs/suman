'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ITAPJSONTestCase} from "suman-types/dts/reporters";
import {Stream, Transform} from "stream";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import su = require('suman-utils');
import chalk from 'chalk';
const parser = require('tap-parser');
import TAPJSONParser from 'tap-json-parser';
import {events} from 'suman-events';
import EE = require('events');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();

///////////////////////////////////////////////////////////////////////////

let firstTAPOccurrence = true;
let firstTAPCall = true;

export const getTapParser = function () {
  
  if (firstTAPCall) {
    firstTAPCall = false;
    _suman.log.info(chalk.black.bold('we are handling TAP.'));
  }
  
  const p = parser();
  
  p.on('complete', function (data: string) {
    rb.emit(String(events.TAP_COMPLETE), data);
  });
  
  p.on('assert', function (testpoint: Object) {
    
    if (firstTAPOccurrence) {
      firstTAPOccurrence = false;
      console.log('\n');
      _suman.log.info(chalk.yellow.bold('suman we have received at least one test result via TAP.'));
      console.log('\n');
    }
    
    testpoint = testpoint.testCase || testpoint;
    
    rb.emit(String(events.TEST_CASE_END), testpoint);
    
    if (testpoint.skip) {
      rb.emit(String(events.TEST_CASE_SKIPPED), testpoint);
    }
    else if (testpoint.todo) {
      rb.emit(String(events.TEST_CASE_STUBBED), testpoint);
    }
    else if (testpoint.ok) {
      rb.emit(String(events.TEST_CASE_PASS), testpoint);
    }
    else {
      rb.emit(String(events.TEST_CASE_FAIL), testpoint);
    }
  });
  
  return p;
  
};

let firstTAPJSONOccurrence = true;
let firstTAPJSONCall = true;

export const getTapJSONParser = function () {
  
  if (firstTAPJSONCall) {
    firstTAPJSONCall = false;
    _suman.log.info(chalk.black.bold('we are handling TAP-JSON.'));
  }
  
  const p = TAPJSONParser();
  
  p.on('testpoint', function (d: ITAPJSONTestCase) {
    
    if (firstTAPJSONOccurrence) {
      firstTAPJSONOccurrence = false;
      console.log('\n');
      _suman.log.info(chalk.yellow.bold('suman runner has received first test result via TAP-JSON.'));
      console.log('\n');
    }
    
    const testpoint = d.testCase;
    
    if (!testpoint) {
      throw new Error('implementation error: testpoint data does not exist for tap-json object => ' + util.inspect(d));
    }
    
    // rb.emit(String(events.TEST_CASE_END), testpoint);
    rb.emit(String(events.TEST_CASE_END_TAP_JSON), d);
    
    if (testpoint.skip) {
      rb.emit(String(events.TEST_CASE_SKIPPED_TAP_JSON), d);
    }
    else if (testpoint.todo) {
      rb.emit(String(events.TEST_CASE_STUBBED_TAP_JSON), d);
    }
    else if (testpoint.ok) {
      rb.emit(String(events.TEST_CASE_PASS_TAP_JSON), d);
    }
    else {
      rb.emit(String(events.TEST_CASE_FAIL_TAP_JSON), d);
    }
  });
  
  return p;
  
};


