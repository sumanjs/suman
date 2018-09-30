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
const includes = require('lodash.includes');
const fnArgs = require('function-arguments');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from '../config/suman-constants';
import {TestBlock} from "../test-suite-helpers/test-suite";
const iocPromiseContainer: IIocPromiseContainer = {};

/////////////////////////////////////////////////////////////

interface IIocPromiseContainer {
  [key: string]: Promise<any>;
}

/////////////////////////////////////////////////////////////

const thisVal =
  {'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.'};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const acquireIocDeps = function (deps: Array<string>, suite: TestBlock, cb: Function) {

  const obj: IInjectionDeps = {};
  const SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';

  deps.forEach(dep => {

    if (includes(constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in _suman.iocConfiguration) {
      throw new Error('Warning: you added a IoC dependency for "' + dep +
        '" but this is a reserved internal Suman dependency injection value.');
    }

    obj[dep] = undefined;

  });

  const promises = Object.keys(obj).map(function (key) {

    if (iocPromiseContainer[key]) {
      return iocPromiseContainer[key];
    }

    return iocPromiseContainer[key] = new Promise(function (resolve, reject) {

      const fn = obj[key];

      if (fn === '[suman reserved - no ioc match]') {
        // most likely a core dep (assert, http, etc)
        // obj[key] = undefined;
        resolve();
      }
      else if (typeof fn !== 'function') {
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
          // there should be at least two instances of the 'cb' string in the function,
          // one in the parameters array, the other in the fn body.
          throw new Error('Callback in your function was not present => ' + str);
        }

        fn.call(thisVal, function (err: any, val: any) {
          err ? reject(err) : resolve(val);
        });
      }
      else {
        Promise.resolve(fn.call(thisVal)).then(resolve, reject);
      }

    });

  });

  Promise.all(promises).then(function (deps) {

      Object.keys(obj).forEach(function (key, index) {
        obj[key] = deps[index];
      });
      //want to exit out of current tick for purposes of domains
      process.domain && process.domain.exit();
      process.nextTick(cb, null, obj);
    },
    function (err) {
      _suman.log.error('Error acquiring pre/integrant dependency:', err.stack || err);
      //want to exit out of current tick for purposes of domains
      process.domain && process.domain.exit();
      process.nextTick(cb, err, {});
    });
};
