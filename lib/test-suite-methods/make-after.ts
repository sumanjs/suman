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
import * as chalk from 'chalk';
import su from 'suman-utils';

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const {handleSetupComplete} = require('../handle-setup-complete');
import {evalOptions} from '../helpers/eval-options';
import {parseArgs} from '../helpers/parse-pragmatik-args';


///////////////////////////////////////////////////////////////////////////////////////

const typeName = 'after';
const acceptableOptions = <IAcceptableOptions> {
  plan: true,
  throws: true,
  fatal: true,
  cb: true,
  timeout: true,
  skip: true,
  always: true,
  last: true,
  events: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IAfterOpts): void {

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

export const makeAfter = function (suman: ISuman): IAfterFn {

  return function ($desc: string, $opts: IAfterOpts): ITestSuite {

    const zuite = suman.ctx;
    handleSetupComplete(zuite, typeName);

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: su.isObject($opts) ? $opts.__preParsed : null
    });

    const vetted = parseArgs(args);
    const [desc, opts, fn] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    handleBadOptions(opts);

    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps, opts);
    }

    if (opts.always) {
      _suman.afterAlwaysHasBeenRegistered = true;
    }

    if (opts.skip) {
      suman.numHooksSkipped++;
    }
    else if (!fn) {
      suman.numHooksStubbed++;
    }
    else {

      let obj: IAfterObj = {
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || fn.name,
        cb: opts.cb || false,
        throws: opts.throws,
        always: opts.always,
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        events: opts.events,
        last: opts.last,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        fn: fn,
        type: 'after/teardown',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      };

      if (opts.last) {
        zuite.getAftersLast().push(obj);
      }
      else {
        zuite.getAfters().push(obj);
      }

    }

    return zuite;

  };

};




