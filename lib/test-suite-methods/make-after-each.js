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
const implementationError = require('../helpers/implementation-error');
const constants = require('../../config/suman-constants');
const sumanUtils = require('suman-utils/utils');
const handleSetupComplete = require('../handle-setup-complete');


function handleBadOptionsForEachHook(hook, opts) {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    return process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
  }

}

///////////////////////////////////////////////////////////////////////////////

module.exports = function(suman, zuite){

  return function (desc, opts, aAfterEach) {

    handleSetupComplete(zuite);

    const _args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof opts === 'object' ? opts.__preParsed : null
    });

    //TODO: when Node v4 is outdated we can move to array desctructuring
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
      zuite.getAfterEaches().push({
        ctx: zuite,
        timeout: obj.opts.timeout || 11000,
        desc: obj.desc || obj.fn ? obj.fn.name : '(unknown due to stubbed function)',
        cb: obj.opts.cb || false,
        throws: obj.opts.throws,
        planCountExpected: obj.opts.plan,
        fatal: !(obj.opts.fatal === false),
        fn: obj.fn,
        type: 'afterEach/teardownTest',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }
    return zuite;

  };


};
