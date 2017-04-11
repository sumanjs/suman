'use strict';

//core
const domain = require('domain');
const util = require('util');

//npm
const pragmatik = require('pragmatik');
const _ = require('underscore');
const async = require('async');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const constants = require('../../config/suman-constants');
const incr = require('../incrementer');
const handleSetupComplete = require('../handle-setup-complete');


///////////////////////////////////////////////////////////////////////////////

function handleBadOptions(opts: IItOpts) {
  //TODO
}

///////////////////////////////////////////////////////////////////////////////


export = function (suman: ISuman, zuite: ITestSuite): Function {

  return function ($desc: string, $opts: IItOpts, $fn: Function): ITestSuite {

    handleSetupComplete(zuite);

    const args = pragmatik.parse(arguments, rules.testCaseSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    let [desc, opts, fn] = args;
    handleBadOptions(opts);


    if (!fn) {
      zuite.getTests().push({testId: incr(), desc: desc, stubbed: true});
      return zuite;
    }

    // because we now know that fn is defined
    desc = desc || fn.name;

    if (opts.skip) {
      zuite.getTests().push({testId: incr(), desc: desc, skipped: true});
      return zuite;
    }

    if (suman.itOnlyIsTriggered && !opts.only) {
      zuite.getTests().push({testId: incr(), desc: desc, skipped: true, skippedDueToItOnly: true});
      return zuite;
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

    const testData: ITestDataObj = {
      testId: incr(),
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
