'use strict';

//dts
import {IInjectOpts} from "../../dts/inject";
import {IAllOpts, ITestSuite} from "../../dts/test-suite";
import {ISuman} from "../../dts/suman";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const domain = require('domain');
const util = require('util');
const assert = require('assert');

//npm
const pragmatik = require('pragmatik');
const _ = require('underscore');
const async = require('async');
const colors = require('colors/safe');
import su from 'suman-utils';

//project
const _suman = global.__suman = (global.__suman || {});
import evalOptions from '../helpers/eval-options';
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
const handleSetupComplete = require('../handle-setup-complete');


function handleBadOptions(opts: IInjectOpts) {
  //TODO
}

////////////////////////////////////////////////////////////////////////////////////////


export const makeInject = function (suman: ISuman, zuite: ITestSuite): Function {

  return function ($desc: string, $opts: IInjectOpts, $fn: Function) {

    handleSetupComplete(zuite, 'inject');

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    // this style produces cleaner transpile code
    let [desc, opts, arr, fn] = args;
    handleBadOptions(opts);

    if (arr && fn) {
      throw new Error(' => Please define either an array or callback.');
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
      evalOptions(arrayDeps,opts);
    }

    if (opts.skip) {
      _suman._writeTestError(' => Warning => Inject hook was skipped.')
    }
    else if (!fn) {
      _suman._writeTestError(' => Warning => Inject hook was stubbed.')
    }
    else {

      zuite.getInjections().push({  //TODO: add timeout option
        ctx: zuite,
        desc: desc || (fn ? fn.name : '(unknown due to stubbed function)'),
        timeout: opts.timeout || 11000,
        cb: opts.cb || false,
        throws: opts.throws,
        planCountExpected: opts.plan,
        fatal: !(opts.fatal === false),
        fn: fn,
        timeOutError: new Error('*timed out* - did you forget to call done/ctn/fatal()?'),
        type: 'inject',
        warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
      });
    }

    return zuite;

  };


};
