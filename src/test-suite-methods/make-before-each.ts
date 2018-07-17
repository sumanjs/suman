'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ITestSuite, IAcceptableOptions} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {IBeforeEachFn, IBeforeEachOpts} from "suman-types/dts/before-each";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import util = require('util');

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
import {parseArgs} from '../helpers/general';
import {evalOptions} from '../helpers/general';
import {TestBlock} from "../test-suite-helpers/test-suite";

/////////////////////////////////////////////////////////////////////////////////

const acceptableOptions = <IAcceptableOptions> {
  '@DefineObjectOpts': true,
  timeout: true,
  throws: true,
  cb: true,
  __toBeSourcedForIOC: true,
  retries: true,
  desc: true,
  title: true,
  plan: true,
  fatal: true,
  skip: true,
  events: true,
  successEvent: true,
  errorEvent: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IBeforeEachOpts, typeName: string) {

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

///////////////////////////////////////////////////////////////////////////////

export const makeBeforeEach = function (suman: ISuman): IBeforeEachFn {

  return function beforeEach($$desc: string, $opts: IBeforeEachOpts): TestBlock {

    const typeName = beforeEach.name;
    const zuite = suman.ctx;
    handleSetupComplete(zuite, typeName);
    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: su.isObject($opts) ? $opts.__preParsed : null
    });

    try {delete $opts.__preParsed} catch(err){}
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
      zuite.getBeforeEaches().push({
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || fn.name || '(unknown before-each-hook name)',
        fn: fn,
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        events: opts.events,
        retries: opts.retries,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: opts.fatal === true, // default is that fatal is false for beforeEach/afterEach hooks
        cb: opts.cb === true, // default to false
        type: 'beforeEach/setupTest',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };

};
