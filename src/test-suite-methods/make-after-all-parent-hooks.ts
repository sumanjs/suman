'use strict';

//dts
import {ITestSuite} from "suman-types/dts/test-suite";
import {ISuman, Suman} from "../suman";
import {IAfterFn, IAfterObj, IAfterOpts} from "suman-types/dts/after";
import {IGlobalSumanObj} from "suman-types/dts/global";

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
import {constants} from '../config/suman-constants';
import {handleSetupComplete, evalOptions, parseArgs} from '../helpers/general';
import {TestBlock} from "../test-suite-helpers/test-suite";

///////////////////////////////////////////////////////////////////////////////////////

const handleBadOptions = function (opts: IAfterOpts): void {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }
};

////////////////////////////////////////////////////////////////////////////

export const makeAfterAllParentHooks = function (suman: ISuman): IAfterFn {

  return function afterAllParentHooks($desc: string, $opts: IAfterOpts): TestBlock {

    const zuite = suman.ctx;
    handleSetupComplete(zuite, afterAllParentHooks.name);
    const isPreParsed = $opts && $opts.__preParsed;
    const args = pragmatik.parse(arguments, rules.hookSignature, isPreParsed);

    try {
      delete $opts.__preParsed
    } catch (err) {
    }
    // this transpiles much more nicely, rather than inlining it above
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

      zuite.getAfterAllParentHooks().push({
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || fn.name,
        cb: opts.cb  === true,  // default to false
        throws: opts.throws,
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        events: opts.events,
        always: opts.always,
        last: opts.last,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        fn: fn,
        type: 'afterAllParentHooks',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });

    }

    return zuite;

  };

};




