'use strict';
import {IBeforeOpts} from "../../dts/before";
import {ITestSuite} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');
const assert = require('assert');

//npm
const pragmatik = require('pragmatik');
const async = require('async');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const handleSetupComplete = require('../handle-setup-complete');

function handleBadOptions(opts: IBeforeOpts) {
  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }
}

///////////////////////////////////////////////////////////////////////////////

export const makeBefore = function (suman: ISuman, zuite: ITestSuite): Function {

  return function ($desc: string, $opts: IBeforeOpts, $fn: Function) {

    handleSetupComplete(zuite, 'before');

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });


    let [desc, opts, arr, fn] = args;
    handleBadOptions(opts);

    // because we know fn is defined
    desc = desc || fn ? fn.name : '(unknown name)';

    if (arr && fn) {
      throw new Error(' => Please define either an array or callback.');
    }

    let arrayDeps: Array<string>;

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

      const preVal: Array<string> = [];
      arrayDeps.forEach(function (a) {
        if (typeof a === 'object' && !Array.isArray(a)) {
          Object.assign(opts, a);
        }
        else if (typeof a === 'string') {
          if (/:/.test(a)) {
            preVal.push(a);
          }
        }
        else {
          throw new Error(' => Argument in array must be string or plain object, instead we have =>' +
            '\n' + util.inspect(a));
        }
      });

      const toEval = ['(function self(){return {', preVal.join(','), '}})()'].join('');
      const obj = eval(toEval);
      //overwrite opts with values from array
      Object.assign(opts, obj);
    }

    if (opts.skip) {
      suman.numHooksSkipped++;
    }
    else if (!fn) {
      suman.numHooksStubbed++;
    }
    else {

      zuite.getBefores().push({
        ctx: zuite,
        desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
        timeout: opts.timeout || 11000,
        cb: opts.cb || false,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        fn: fn,
        timeOutError: new Error('*timed out* - did you forget to call done/ctn/fatal()?'),
        type: 'before/setup',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };


};
