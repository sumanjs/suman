'use strict';

//dts
import {IGlobalSumanObj} from "../../dts/global";
import {ITestSuite} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";
import {IBeforeEachFn, IBeforeEachOpts} from "../../dts/before-each";

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
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const {handleSetupComplete} = require('../handle-setup-complete');
import parseArgs from '../helpers/parse-pragmatik-args';
import evalOptions from '../helpers/eval-options';


function handleBadOptions(opts: IBeforeEachOpts) {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }

}

///////////////////////////////////////////////////////////////////////////////

export const makeBeforeEach = function (suman: ISuman, zuite: ITestSuite): IBeforeEachFn {

  return function ($$desc: string, $opts: IBeforeEachOpts): ITestSuite {

    handleSetupComplete(zuite, 'beforeEach');

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: su.isObject($opts) ? $opts.__preParsed : null
    });

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
      zuite.getBeforeEaches().push({  //TODO: add timeout option
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || fn.name || '(unknown hook name)',
        fn: fn,
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
