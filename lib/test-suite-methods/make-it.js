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

const rules = require('../helpers/handle-varargs');
const constants = require('../../config/suman-constants');
const incr = require('../incrementer');
const handleSetupComplete = require('../handle-setup-complete');

///////////////////////////////////////////////////////////////////////////////


module.exports = function(suman, zuite){

  return function (desc, opts, fn) {

    handleSetupComplete(zuite);

    const args = pragmatik.parse(arguments, rules.testCaseSignature, {
      preParsed: typeof opts === 'object' ? opts.__preParsed : null
    });

    //TODO: when Node v4 is outdated we can move to array desctructuring
    desc = args[0];
    opts = args[1];
    fn = args[2];


    if (!fn) {
      zuite.getTests().push({testId: incr(), desc: desc, stubbed: true});
      return zuite;
    }

    // because we know fn is defined
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
      return process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    }

    if (opts.hasOwnProperty('parallel')) {
      if (opts.hasOwnProperty('mode')) {
        console.log(' => Suman warning => Used both parallel and mode options => mode will take precedence.');
        if (opts.mode !== 'parallel' && opts.mode !== 'series') {
          console.log(' => Suman warning => valid "môde" options are only values of "parallel" or "series".');
        }
      }
    }

    const testData = {
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
      desc: desc,
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
