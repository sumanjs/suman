'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IInjectOpts, IInjectFn} from "suman-types/dts/inject";
import {IAllOpts, ITestSuite, IAcceptableOptions} from "suman-types/dts/test-suite";
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
const _ = require('underscore');
import async = require('async');
import * as chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {evalOptions} from '../helpers/general';
import rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {handleSetupComplete} from '../helpers/general';

///////////////////////////////////////////////////////////////////////////////////////

const typeName = 'inject';
const acceptableOptions = <IAcceptableOptions> {
  '@DefineObject': true,
  plan: true,
  throws: true,
  fatal: true,
  cb: true,
  timeout: true,
  sourced: true,
  define: true,
  skip: true,
  events: true,
  successEvents: true,
  errorEvents: true,
  __preParsed: true
};

const handleBadOptions = function (opts: IInjectOpts) {

  Object.keys(opts).forEach(function (k) {
    if (!acceptableOptions[k]) {
      const url = `${constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
      throw new Error(`'${k}' is not a valid option property for an ${typeName} hook. See: ${url}`);
    }
  });

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    _suman.log.error(new Error('Suman usage error => "plan" option is not an integer.').stack);
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }

};

////////////////////////////////////////////////////////////////////////////////////////

export const makeInject = function (suman: ISuman): IInjectFn {

  return function ($desc: string, $opts: IInjectOpts, $fn: Function) {

    const zuite = suman.ctx;
    handleSetupComplete(zuite, 'inject');

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    try {delete $opts.__preParsed} catch(err){}
    // this style produces cleaner transpile code
    let [desc, opts, arr, fn] = args;
    handleBadOptions(opts);

    if (arr && fn) {
      throw new Error('Please use either an array or function, but not both.');
    }

    let arrayDeps: Array<IAllOpts>;

    if (arr) {
      //note: you can't stub a test block!
      fn = arr[arr.length - 1];
      assert.equal(typeof fn, 'function', ' => Suman usage error => ' +
        'You need to pass a function as the last argument to the array.');
      // remove last element
      arrayDeps = arr.slice(0, -1);
    }

    //avoid unncessary pre-assignment
    arrayDeps = arrayDeps || [];

    if (arrayDeps.length > 0) {
      evalOptions(arrayDeps, opts);
    }

    if (opts.skip) {
      _suman.writeTestError(new Error('Suman usage warning => Inject hook was *skipped* by the developer.').stack);
    }
    else if (!fn) {
      _suman.writeTestError(new Error('Suman usage warning => Inject hook was *stubbed* by the developer.').stack);
    }
    else {

      zuite.getInjections().push({
        ctx: zuite,
        desc: desc || fn.name || constants.UNKNOWN_INJECT_HOOK_NAME,
        timeout: opts.timeout || 11000,
        cb: opts.cb || false,
        throws: opts.throws,
        successEvents: opts.successEvents,
        errorEvents: opts.errorEvents,
        events: opts.events,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        fn: fn,
        type: typeName,
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };

};
