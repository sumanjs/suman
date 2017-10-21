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
import * as chalk from 'chalk';
import su from 'suman-utils';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
const implementationError = require('../helpers/implementation-error');
const {constants} = require('../../config/suman-constants');
const {handleSetupComplete} = require('../handle-setup-complete');
import {evalOptions} from '../helpers/eval-options';
import {parseArgs} from '../helpers/parse-pragmatik-args';

//////////////////////////////////////////////////////////////////////////////

const typeName = 'after-each';
const acceptableOptions = <IAcceptableOptions> {
  plan: true,
  throws: true,
  fatal: true,
  cb: true,
  timeout: true,
  skip: true,
  events: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IAfterEachOpts): void {

  Object.keys(opts).forEach(function (k) {
    if (!acceptableOptions[k]) {
      const url = `${constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
      throw new Error(`'${k}' is not a valid option property for an ${typeName} hook. See: ${url}`);
    }
  });

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    _suman.logError(new Error(' => Suman usage error => "plan" option is not an integer.').stack);
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }
};

//////////////////////////////////////////////////////////////////////////////


export const makeAfterEach = function (suman: ISuman): IAfterEachFn {

  return function ($$desc: string, $opts: IAfterEachOpts): ITestSuite {

    const zuite = suman.ctx;
    handleSetupComplete(zuite, typeName);

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: su.isObject($opts) ? $opts.__preParsed : null
    });

    try {delete $opts.__preParsed} catch(err){}
    const vetted = parseArgs(args);
    const [desc, opts, fn] = vetted.args;
    const arrayDeps = vetted.arrayDeps;
    handleBadOptions(opts);

    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps,opts);
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
        cb: opts.cb || false,
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        events: opts.events,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        fn: fn,
        type: 'afterEach/teardownTest',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };


};
