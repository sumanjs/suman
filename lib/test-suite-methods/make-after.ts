'use strict';

//core
const domain = require('domain');
const util = require('util');

//npm
const pragmatik = require('pragmatik');
const async = require('async');
const colors = require('colors/safe');

//project

const rules = require('../helpers/handle-varargs');
const constants = require('../../config/suman-constants');
const handleSetupComplete = require('../handle-setup-complete');


function handleBadOptionsForAllHook(hook: any, opts: any) : void {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    return process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
  }
}

//////////////////////////// types  ///////////////////////////////////


interface AfterOpts {
  __preParsed?: boolean,
  skip: boolean,
  timeout: number,
  fatal: boolean,
  cb: boolean,
  throws: RegExp,
  plan: number
}


//////////////////////////////////////////////////////////////////////

export = function(suman: Suman, zuite: TestSuite){

  return function ($desc: string, $opts: AfterOpts, $fn: Function) {

    handleSetupComplete(zuite);

    const args : Array<any> = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    let [desc, opts, fn] = args;

    handleBadOptionsForAllHook(opts, zuite);

    if (opts.skip) {
      suman.numHooksSkipped++;
    }
    else if (!fn) {
      suman.numHooksStubbed++;
    }
    else {
      zuite.getAfters().push({
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
        cb: opts.cb || false,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        fn: fn,
        type: 'after/teardown',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };


};
