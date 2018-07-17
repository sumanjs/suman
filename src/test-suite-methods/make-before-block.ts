'use strict';

//dts
import {IBeforeFn, IBeforeOpts} from "suman-types/dts/before";
import {IAllOpts, ITestSuite, IAcceptableOptions} from "suman-types/dts/test-suite";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ISuman, Suman} from "../suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
const pragmatik = require('pragmatik');
import async = require('async');
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
import {constants} from '../config/suman-constants';
import {handleSetupComplete} from '../helpers/general';
import {evalOptions} from '../helpers/general';
import {parseArgs} from '../helpers/general';

//////////////////////////////////////////////////////////////////////////////

const acceptableOptions = <IAcceptableOptions> {
  '@DefineObjectOpts': true,
  plan: true,
  throws: true,
  fatal: true,
  __toBeSourcedForIOC: true,
  retries: true,
  cb: true,
  timeout: true,
  skip: true,
  desc: true,
  title: true,
  events: true,
  first: true,
  last: true,
  successEvent: true,
  errorEvent: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IBeforeOpts, typeName: string) {
  
  Object.keys(opts).forEach(function (k) {
    if (!acceptableOptions[k]) {
      const url = `${constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
      throw new Error(`'${k}' is not a valid option property for a ${typeName} hook. See: ${url}`);
    }
  });
  
  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    _suman.log.error(new Error('Suman usage error => "plan" option is not an integer.').stack);
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
  }
};

////////////////////////////////////////////////////////////////////////////////////////////

export const makeBeforeBlock = function (suman: ISuman): IBeforeFn {
  
  return function beforeBlock($$desc: string, $opts: IBeforeOpts) {
    
    const zuite = suman.ctx;
    handleSetupComplete(zuite, beforeBlock.name);
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
    handleBadOptions(opts, beforeBlock.name);
    
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
      
      let obj = {
        always: null, // always only really applies to after hooks
        last: Boolean(opts.last),
        first: Boolean(opts.first),
        ctx: zuite,
        desc: desc || fn.name || '(unknown before-all-hook name)',
        timeout: opts.timeoutVal || opts.timeout || 11000,
        cb: opts.cb === true,  // default to false
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        events: opts.events,
        retries: opts.retries,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: opts.fatal !== false, // default is true for before hooks!
        fn: fn,
        type: 'before/setup',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      };
      
      zuite.getBeforeBlocks().push(obj);
      
    }
    
    return zuite;
    
  };
  
};
