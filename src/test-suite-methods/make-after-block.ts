'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ITestSuite, IAcceptableOptions} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {IAfterFn, IAfterObj, IAfterOpts} from "suman-types/dts/after";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');

//npm
const pragmatik = require('pragmatik');
import chalk from 'chalk';
import * as su from 'suman-utils';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
const {constants} = require('../config/suman-constants');
import {handleSetupComplete} from '../helpers/general';
import {evalOptions} from '../helpers/general';
import {parseArgs} from '../helpers/general';
import {TestBlock} from "../test-suite-helpers/test-suite";

///////////////////////////////////////////////////////////////////////////////////////

const acceptableOptions = <IAcceptableOptions> {
  '@DefineObjectOpts': true,
  plan: true,
  throws: true,
  fatal: true,
  cb: true,
  desc: true,
  title: true,
  __toBeSourcedForIOC: true,
  timeout: true,
  retries: true,
  skip: true,
  always: true,
  first: true,
  last: true,
  events: true,
  successEvent: true,
  errorEvent: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IAfterOpts, typeName: string): void {
  
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

////////////////////////////////////////////////////////////////////////////

export const makeAfterBlock = function (suman: ISuman): IAfterFn {
  
  return function afterBlock($desc: string, $opts: IAfterOpts): TestBlock {
    
    const zuite = suman.ctx;
    handleSetupComplete(zuite, afterBlock.name);
    const isPreParsed = $opts && $opts.__preParsed;
    const args = pragmatik.parse(arguments, rules.hookSignature, isPreParsed);
    
    try {
      delete $opts.__preParsed
    } catch (err) {
    }
    const vetted = parseArgs(args);
    const [desc, opts, fn] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    handleBadOptions(opts, afterBlock.name);
    
    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps, opts);
    }
    
    if (opts.last && opts.first) {
      throw new Error('Cannot use both "first" and "last" option for "after" hook.');
    }
    
    if (opts.skip) {
      suman.numHooksSkipped++;
    }
    else if (!fn) {
      suman.numHooksStubbed++;
    }
    else {
      
      let obj: IAfterObj = {
        last: Boolean(opts.last),
        first: Boolean(opts.first),
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || fn.name || '(unknown after-all-hook name)',
        cb: opts.cb === true, // default to false
        throws: opts.throws,
        always: opts.always,
        retries: opts.retries,
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        events: opts.events,
        planCountExpected: opts.plan,
        fatal: opts.fatal === true, // default is false for after hooks!
        fn: fn,
        type: 'after/teardown',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      };
      
      zuite.getAfterBlocks().push(obj);
      
    }
    
    return zuite;
    
  };
  
};




