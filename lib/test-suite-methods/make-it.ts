'use strict';
import {ITestSuite} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";
import {IItOpts, ITestDataObj} from "../../dts/it";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');
const util = require('util');

//npm
const pragmatik = require('pragmatik');
const _ = require('underscore');
const async = require('async');
const colors = require('colors/safe');
import su from 'suman-utils';

//project
const _suman = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const incr = require('../incrementer');
const handleSetupComplete = require('../handle-setup-complete');
import parseArgs from '../helpers/parse-pragmatik-args';
import evalOptions from '../helpers/eval-options';

///////////////////////////////////////////////////////////////////////////////

function handleBadOptions(opts: IItOpts) {
  //TODO
}

///////////////////////////////////////////////////////////////////////////////


export const makeIt = function (suman: ISuman, zuite: ITestSuite): Function {

  return function ($desc: string, $opts: IItOpts): ITestSuite {

    handleSetupComplete(zuite, 'it');

    const args = pragmatik.parse(arguments, rules.testCaseSignature, {
      preParsed: su.isObject($opts) ? $opts.__preParsed : null
    });

    const vetted = parseArgs(args);
    const [desc, opts, fn] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    handleBadOptions(opts);

    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps,opts);
    }

    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
      console.error(' => Suman usage error => "plan" option is not an integer.');
      process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
      return;
    }

    if (opts.hasOwnProperty('parallel')) {
      if (opts.hasOwnProperty('mode')) {
        console.log(' => Suman warning => Used both parallel and mode options => mode will take precedence.');
        if (opts.mode !== 'parallel' && opts.mode !== 'series' && opts.mode !== 'serial') {
          console.log(' => Suman warning => valid "môde" options are only values of "parallel" or "series" or "serial"' +
            ' => ("serial" is an alias to "series").');
        }
      }
    }


    const inc = incr();

    if (!fn) {
      zuite.getTests().push({testId: inc, desc: desc, stubbed: true} as ITestDataObj);
      return zuite;
    }

    if (opts.skip) {
      zuite.getTests().push({testId: inc, desc: desc, skipped: true} as ITestDataObj);
      return zuite;
    }

    if (suman.itOnlyIsTriggered && !opts.only) {
      zuite.getTests().push({testId: inc, desc: desc, skipped: true, skippedDueToItOnly: true} as ITestDataObj);
      return zuite;
    }

    const testData: ITestDataObj = {
      testId: inc,
      stubbed: false,
      data: {},
      planCountExpected: opts.plan,
      originalOpts: opts,
      only: opts.only,
      skip: opts.skip,
      value: opts.value,
      throws: opts.throws,
      parallel: (opts.parallel === true || opts.mode === 'parallel'),
      mode: opts.mode,
      delay: opts.delay,
      cb: opts.cb,
      type: 'it-standard',
      timeout: opts.timeout || 20000,
      desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
      fn: fn,
      warningErr: new Error('SUMAN_TEMP_WARNING_ERROR'),
      timedOut: false,
      complete: false,
      error: null
    };

    if (opts.parallel || (zuite.parallel && opts.parallel !== false)) {
      zuite.getParallelTests().push(testData);
    }
    else {
      zuite.getTests().push(testData);
    }

    return zuite;

  };
};
