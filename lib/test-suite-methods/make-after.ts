'use strict';
import {IAfterObj, ITestSuite} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";
import {AfterHookCallbackMode, AfterHookRegularMode, IAfterFn, IAfterOpts} from "../../dts/after";


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

//

//project
const _suman = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const handleSetupComplete = require('../handle-setup-complete');

///////////////////////////////////////////////////////////////////////////////////////

function handleBadOptions(opts: IAfterOpts): void {

  if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
    console.error(' => Suman usage error => "plan" option is not an integer.');
    process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
    return;
  }
}



////////////////////////////////////////////////////////////////////////////

export const makeAfter = function (suman: ISuman, zuite: ITestSuite): IAfterFn {

  return function ($desc: string, $opts: IAfterOpts, $fn: AfterHookCallbackMode | AfterHookRegularMode): ITestSuite {

    handleSetupComplete(zuite, 'after');

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    // this transpiles much more nicely, rather than inlining it above
    let [desc, opts, arr, fn] = args;
    handleBadOptions(opts);

    if (arr && fn) {
      throw new Error(' => Please define either an array or callback.');
    }

    if(opts.always){
      _suman.afterAlwaysHasBeenRegistered = true;
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
        if (/:/.test(a)) {
          preVal.push(a);
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

      let obj: IAfterObj = {
        ctx: zuite,
        timeout: opts.timeout || 11000,
        desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
        cb: opts.cb || false,
        throws: opts.throws,
        always: opts.always,
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




