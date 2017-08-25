'use strict';
import {IInjectionDeps} from "../../dts/injection";
import {IGlobalSumanObj, IPseudoError} from "../../dts/global";
import {ITestSuite} from "../../dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
import * as chalk from 'chalk';
import su from 'suman-utils';

const includes = require('lodash.includes');
const fnArgs = require('function-arguments');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from '../../config/suman-constants';

let iocPromise: Promise<any> = null;
const SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';

/////////////////////////////////////////////////////////////

const thisVal =
  {'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.'};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const acquireIocStaticDeps = function () {

  if (iocPromise) {
    return iocPromise;
  }

  let ret: any, iocStaticFn: any;

  try {
    iocStaticFn = require(_suman.sumanHelperDirRoot + '/suman.ioc.static.js');
    iocStaticFn = iocStaticFn.default || iocStaticFn;
    assert.equal(typeof iocStaticFn, 'function', '`suman.ioc.static.js` must export a function.');
    ret = iocStaticFn.apply(null, []);
    ret = ret.dependencies || ret.deps;
    assert(su.isObject(ret),
      '`suman.ioc.static.js` must export a function which returns an object with a "dependencies" property.');
  }
  catch (err) {
    _suman.logError(err.stack || err);
    _suman.logError('suman will continue optimistically.');
    return Promise.resolve(_suman.$staticIoc = {});
  }

  const promises = Object.keys(ret).map(function (key) {

    return new Promise(function (resolve, reject) {

      const fn = ret[key];

      if (typeof fn !== 'function') {
        reject(new Error('Value in IOC object was not a function for corresponding key => ' +
          '"' + key + '", value => "' + util.inspect(fn) + '"'));
      }
      else if (fn.length > 1) {
        reject(new Error(chalk.red(' => Suman usage error => suman.ioc.js functions take 0 or 1 arguments, ' +
          'with the single argument being a callback function.')));
      }
      else if (fn.length > 0) {
        let args = fnArgs(fn);
        let str = fn.toString();
        let matches = str.match(new RegExp(args[1], 'g')) || [];
        if (matches.length < 2) {
          //there should be at least two instances of the 'cb' string in the function,
          // one in the parameters array, the other in the fn body.
          throw new Error('Callback in your function was not present => ' + str);
        }

        fn.call(thisVal, function (err: IPseudoError, val: any) {
          err ? reject(err) : resolve(val);
        });
      }
      else {
        Promise.resolve(fn.call(thisVal)).then(resolve, reject);
      }

    });

  });

  return iocPromise = Promise.all(promises).then(function (deps) {

      let final: any = {};

      Object.keys(ret).forEach(function (key, index) {
        final[key] = deps[index];
      });

      return _suman.$staticIoc = final;

    },
    function (err) {
      _suman.logError(err.stack || err);
      _suman.logError('despite the error, suman will continue optimistically.');
      return _suman.$staticIoc = {};
    });

};
