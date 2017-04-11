'use strict';

//core
const domain = require('domain');
const util = require('util');

//npm
const pragmatik = require('pragmatik');
const async = require('async');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const constants = require('../../config/suman-constants');
const handleSetupComplete = require('../handle-setup-complete');


function handleBadOptions(opts: IBeforeEachOpts) {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
     process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
     return;
  }

}

///////////////////////////////////////////////////////////////////////////////

export = function(suman: ISuman, zuite: ITestSuite): Function {

  return function ($desc: string, $opts: IBeforeEachOpts, $aBeforeEach: Function) : ITestSuite {

    handleSetupComplete(zuite);

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    const [desc, opts, fn] = args;
    handleBadOptions(opts);

    if (opts.skip) {
      suman.numHooksSkipped++;
    }
    else if (!fn) {
      suman.numHooksStubbed++;
    }
    else {
      zuite.getBeforeEaches().push({  //TODO: add timeout option
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
        fn: fn,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        cb: opts.cb || false,
        type: 'beforeEach/setupTest',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };

};
