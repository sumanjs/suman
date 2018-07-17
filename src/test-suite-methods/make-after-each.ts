'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ITestSuite, IAcceptableOptions} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {IAfterEachFn, IAfterEachOpts, TAfterEachHook} from "suman-types/dts/after-each";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const pragmatik = require('pragmatik');
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
import {implementationError} from '../helpers/general';
import {constants} from '../config/suman-constants';
import {handleSetupComplete} from '../helpers/general';
import {evalOptions} from '../helpers/general';
import {parseArgs} from '../helpers/general';
import {TestBlock} from "../test-suite-helpers/test-suite";

//////////////////////////////////////////////////////////////////////////////

const acceptableOptions = <IAcceptableOptions> {
  '@DefineObjectOpts': true,
  plan: true,
  throws: true,
  fatal: true,
  ioc: true,
  __toBeSourcedForIOC: true,
  retries: true,
  cb: true,
  timeout: true,
  skip: true,
  desc: true,
  title: true,
  events: true,
  successEvent: true,
  errorEvent: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IAfterEachOpts, typeName: string): void {
  
  Object.keys(opts).forEach(function (k) {
    if (!acceptableOptions[k]) {
      const url = `${constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
      throw new Error(`'${k}' is not a valid option property for an ${typeName} hook. See: ${url}`);
    }
  });
  
  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    _suman.log.error(new Error(' => Suman usage error => "plan" option is not an integer.').stack);
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }
};

//////////////////////////////////////////////////////////////////////////////

export const makeAfterEach = function (suman: ISuman): IAfterEachFn {
  
  return function afterEach($$desc: string, $opts: IAfterEachOpts): TestBlock {
    
    const typeName = afterEach.name;
    const zuite = suman.ctx;
    handleSetupComplete(zuite, typeName);
    const isPreParsed = $opts && $opts.__preParsed;
    const args = pragmatik.parse(arguments, rules.hookSignature, isPreParsed);
    
    try {
      delete $opts.__preParsed
    }
    catch (err) {
      //ignore
    }
    
    const vetted = parseArgs(args);
    const [desc, opts, fn] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    handleBadOptions(opts, typeName);
    
    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps, opts);
    }
    
    if (opts.skip) {
      suman.numHooksSkipped++;
    }
    else if (!fn) {
      suman.numHooksStubbed++;
    }
    else {
      zuite.getAfterEaches().push({
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || fn.name || '(unknown afterEach-hook name)',
        cb: opts.cb === true, // default to false
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        retries: opts.retries,
        events: opts.events,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: opts.fatal === true, // default is that fatal is false for beforeEach/afterEach hooks
        fn: fn,
        type: 'afterEach/teardownTest',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }
    
    return zuite;
    
  };
  
};
