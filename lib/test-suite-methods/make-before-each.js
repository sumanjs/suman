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
const handleSetupComplete = require('../handle-setup-complete');


function handleBadOptionsForEachHook(hook, opts) {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    return process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
  }

}

///////////////////////////////////////////////////////////////////////////////


module.exports = function(suman, zuite){

  return function (desc, opts, aBeforeEach) {

    handleSetupComplete(zuite);

    const _args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof opts === 'object' ? opts.__preParsed : null
    });

    const obj = {
      desc: _args[0],
      opts: _args[1],
      fn: _args[2]
    };

    handleBadOptionsForEachHook(obj.opts, zuite);

    if (obj.opts.skip) {
      suman.numHooksSkipped++;
    }
    else if (!obj.fn) {
      suman.numHooksStubbed++;
    }
    else {
      zuite.getBeforeEaches().push({  //TODO: add timeout option
        ctx: zuite,
        timeout: obj.opts.timeout || 11000,
        desc: obj.desc || obj.fn ? obj.fn.name : '(unknown due to stubbed function)',
        fn: obj.fn,
        throws: obj.opts.throws,
        planCountExpected: obj.opts.plan,
        fatal: !(obj.opts.fatal === false),
        cb: obj.opts.cb || false,
        type: 'beforeEach/setupTest',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };

};
