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
import * as chalk from 'chalk';
import su from 'suman-utils';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const {handleSetupComplete} = require('../handle-setup-complete');
import {parseArgs} from '../helpers/parse-pragmatik-args';
import evalOptions from '../helpers/eval-options';

/////////////////////////////////////////////////////////////////////////////////

const typeName = 'before-each';
const acceptableOptions = <IAcceptableOptions> {
  timeout: true,
  throws: true,
  cb: true,
  plan: true,
  fatal: true,
  skip: true,
  events: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IBeforeEachOpts) {

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

  return function ($$desc: string, $opts: IBeforeEachOpts): ITestSuite {

    const zuite = suman.ctx;
    handleSetupComplete(zuite, 'beforeEach');

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
