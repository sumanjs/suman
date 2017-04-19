'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

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

///////////////////////////////////////////////////////////////////////////////////////

function handleBadOptions(opts: IAfterOpts): void {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }
}

//////////////////////////// inline types  ///////////////////////////////////

 namespace after {

  // after
  export interface IAfterFn {
    (desc: string, opts: IAfterOpts, fn: Function): void,
    cb?: IAfterFn,
    skip?: IAfterFn
  }

  export interface IAfterOpts {
    __preParsed?: boolean,
    skip: boolean,
    timeout: number,
    fatal: boolean,
    cb: boolean,
    throws: RegExp,
    plan: number
  }


  export interface IAfterHook {

  }

  export type AfterHookCallbackMode = (h: IAfterHook) => void;
  export type AfterHookRegularMode = (h: IAfterHook | undefined) => Promise<any>;

}


////////////////////////////////////////////////////////////////////////////

function after(suman: ISuman, zuite: ITestSuite): after.IAfterFn {

  return function ($desc: string, $opts: IAfterOpts, $fn: after.AfterHookCallbackMode | after.AfterHookRegularMode): ITestSuite {

    handleSetupComplete(zuite);

    const args: Array<any> = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    // this transpiles much more nicely, rather than inlining it above
    const [desc, opts, fn] = args;
    handleBadOptions(opts);

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

}

export = after;



