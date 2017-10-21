'use strict';

//dts
import {ITestSuite, IAcceptableOptions} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {IItOpts, ITestDataObj, ItFn} from "suman-types/dts/it";
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
const pragmatik = require('pragmatik');
const _ = require('underscore');
import async = require('async');
import * as chalk from 'chalk';
import su from 'suman-utils';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {handleSetupComplete} from '../helpers/general';
import {parseArgs} from '../helpers/general';
import {evalOptions} from '../helpers/general';

///////////////////////////////////////////////////////////////////////////////

const typeName = 'it';
const acceptableOptions = <IAcceptableOptions> {
  plan: true,
  throws: true,
  fatal: true,
  cb: true,
  val: true,
  value: true,
  parallel: true,
  series: true,
  mode: true,
  timeout: true,
  only: true,
  skip: true,
  events: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IItOpts) {

  Object.keys(opts).forEach(function (k) {
    if (!acceptableOptions[k]) {
      const url = `${constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
      throw new Error(`'${k}' is not a valid option property for an ${typeName} hook. See: ${url}`);
    }
  });

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }

};

///////////////////////////////////////////////////////////////////////////////

let id = 1;

const incr = function (){
  // test suite incrementer
  return id++;
};

///////////////////////////////////////////////////////////////////////////////

export const makeIt = function (suman: ISuman): ItFn {

  return function ($desc: string, $opts: IItOpts): ITestSuite {

    const sumanOpts = suman.opts, zuite = suman.ctx;
    handleSetupComplete(zuite, 'it');

    const args = pragmatik.parse(arguments, rules.testCaseSignature, {
      preParsed: su.isObject($opts) ? $opts.__preParsed : null
    });

    try {delete $opts.__preParsed} catch(err){}
    const vetted = parseArgs(args);
    const [desc, opts, fn] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    handleBadOptions(opts);

    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps, opts);
    }

    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
      console.error(' => Suman usage error => "plan" option is not an integer.');
      process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
      return;
    }

    if (opts.hasOwnProperty('parallel')) {
      if (opts.hasOwnProperty('mode')) {
        _suman.logWarning('warning => Used both parallel and mode options => mode will take precedence.');
        if (opts.mode !== 'parallel' && opts.mode !== 'series' && opts.mode !== 'serial') {
          _suman.logWarning('warning => valid "môde" options are only values of "parallel" or "series" or "serial"' +
            ' => ("serial" is an alias to "series").');
        }
      }
    }

    const inc = incr();

    if (opts.skip && !sumanOpts.force && !sumanOpts.allow_skip) {
      throw new Error('Test block was declared as "skipped" but "--allow-skip" option not specified.');
    }

    if (opts.only && !sumanOpts.force && !sumanOpts.allow_only) {
      throw new Error('Test block was declared as "only" but "--allow-only" option not specified.');
    }

    if (opts.skip || opts.skipped) {
      zuite.getTests().push({testId: inc, desc: desc, skipped: true} as ITestDataObj);
      return zuite;
    }

    if (!fn) {
      zuite.getTests().push({testId: inc, desc: desc, stubbed: true} as ITestDataObj);
      return zuite;
    }

    if (suman.itOnlyIsTriggered && !opts.only) {
      zuite.getTests().push({testId: inc, desc: desc, skipped: true, skippedDueToItOnly: true} as ITestDataObj);
      return zuite;
    }

    if (opts.only) {
      suman.itOnlyIsTriggered = true;
    }

    const isSeries = zuite.series || opts.series === true || opts.parallel === false;
    const isFixedParallel = !isSeries && (zuite.parallel || opts.parallel === true || opts.mode === 'parallel');
    const isParallel = (sumanOpts.parallel || sumanOpts.parallel_max) || (!sumanOpts.series && isFixedParallel);
    const isOverallParallel = (opts.fixed && isFixedParallel) || isParallel;

    const testData: ITestDataObj = {
      // ctx: ctx,
      alreadyInitiated: false,
      testId: inc,
      stubbed: false,
      data: {},
      planCountExpected: opts.plan,
      originalOpts: opts,
      only: opts.only,
      skip: opts.skip,
      value: opts.value,
      throws: opts.throws,
      successEvents: opts.successEvents,
      errorEvents: opts.errorEvents,
      events: opts.events,
      fixed: opts.fixed,
      parallel: isOverallParallel,
      mode: opts.mode,
      delay: opts.delay,
      cb: opts.cb,
      type: 'it/test-case',
      timeout: opts.timeout || 20000,
      desc: desc || fn.name || '(unknown test case name)',
      fn: fn,
      warningErr: new Error('SUMAN_TEMP_WARNING_ERROR'),
      timedOut: false,
      complete: false,
      error: null
    };

    if (isOverallParallel) {
      zuite.getParallelTests().push(testData);
    }
    else {
      zuite.getTests().push(testData);
    }

    return zuite;

  };
};
