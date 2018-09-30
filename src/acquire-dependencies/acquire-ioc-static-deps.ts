'use strict';

//dts
import {IInjectionDeps} from "suman-types/dts/injection";
import {IGlobalSumanObj} from "suman-types/dts/global";

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
import chalk from 'chalk';
import * as su from 'suman-utils';

const includes = require('lodash.includes');
const fnArgs = require('function-arguments');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from '../config/suman-constants';
import Timer = NodeJS.Timer;
import {makeIocStaticInjector} from '../injection/ioc-static-injector';
let iocPromise: Promise<any> = null;
const SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';

/////////////////////////////////////////////////////////////

const thisVal = {
  'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.'
};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const acquireIocStaticDeps = function () {

  if (iocPromise) {
    return iocPromise;
  }


  let ret: any,
    iocFnArgs: Array<string>,
    getiocFnDeps: Function,
    iocStaticFn = _suman.iocStaticFn;

  try {
    assert.equal(typeof iocStaticFn, 'function', '<suman.ioc.static.js> must export a function.');
    iocFnArgs = fnArgs(iocStaticFn);
    getiocFnDeps = makeIocStaticInjector();
    ret = iocStaticFn.apply(null, getiocFnDeps(iocFnArgs));
    ret = ret.dependencies || ret.deps;
    assert(su.isObject(ret),
      '`suman.ioc.static.js` must export a function which returns an object with a "dependencies" property.');
  }
  catch (err) {
    if (/Cannot find module/.test(String(err.message))) {
      _suman.log.error(err.message);
    }
    else {
      _suman.log.error(err.stack);
    }
    console.error(/*simply log a new line*/);
    return iocPromise = Promise.resolve(_suman.$staticIoc = {});
  }

  const promises = Object.keys(ret).map(function (key) {

    let to: Timer;

    return new Promise(function (resolve, reject) {

      to = setTimeout(function () {
        reject(`static dep acquisition (suman.static.ioc.js) timed out for key '${key}'`);
      }, _suman.weAreDebugging ? 50000000 : 20000);

      const fn = ret[key];

      if (typeof fn !== 'function') {
        reject(new Error('Value in IOC object was not a function for corresponding key => ' +
          '"' + key + '", actual value was => "' + util.inspect(fn) + '"'));
      }
      else if (fn.length > 1) {
        reject(new Error(chalk.red(' => Suman usage error => <suman.ioc.js> functions take 0 or 1 arguments, ' +
          'with the optional single argument being a callback function.')));
      }
      else if (fn.length > 0) {

        let args = fnArgs(fn);
        let str = fn.toString();
        let matches = str.match(new RegExp(args[0], 'g')) || [];
        if (matches.length < 2) {
          //there should be at least two instances of the 'cb' string in the function,
          // one in the parameters array, the other in the fn body.
          throw new Error('Callback in your function was not present => \n' + str);
        }

        fn.call(thisVal, function (err: any, val: any) {
          err ? reject(err) : resolve(val);
        });
      }
      else {
        Promise.resolve(fn.call(thisVal)).then(resolve, reject);
      }

    })
    .then(function (v) {
      clearTimeout(to);
      return v;
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
      _suman.log.error(err.stack || err);
      _suman.log.error('despite the error, suman will continue optimistically.');
      return _suman.$staticIoc = {};
    });

};
