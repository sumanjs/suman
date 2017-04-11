'use strict';

//dts
import {IInjectOpts} from "../../dts/inject";

//core
const domain = require('domain');
const util = require('util');

//npm
const pragmatik = require('pragmatik');
const _ = require('underscore');
const async = require('async');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');
const constants = require('../../config/suman-constants');
const handleSetupComplete = require('../handle-setup-complete');


function handleBadOptions(opts: IInjectOpts) {
  //TODO
}

////////////////////////////////////////////////////////////////////////////////////////


export = function(suman: ISuman, zuite: ITestSuite) : Function {

  return function ($desc: string, $opts: IInjectOpts, $fn: Function) {

    handleSetupComplete(zuite);

    const args = pragmatik.parse(arguments, rules.hookSignature, {
      preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
    });

    const [desc, opts, fn] = args;
    handleBadOptions(opts);

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
