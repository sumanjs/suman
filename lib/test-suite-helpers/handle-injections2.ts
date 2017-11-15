'use strict';

//dts
import {IInjectionObj, ITestSuite} from "suman-types/dts/test-suite";
import {IPseudoError, IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import util = require('util');
import path = require('path');

//npm
import async = require('async');
import {freezeExistingProps as freeze} from 'freeze-existing-props';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {tProto} from './t-proto';
import {constants} from "../../config/suman-constants";
const weAreDebugging = su.weAreDebugging;

///////////////////////////////////////////////////////////////////

interface IInjectionRetObj {
  [key: string]: any
}

///////////////////////////////////////////////////////////////////

export const handleInjections = function (suite: ITestSuite, cb: Function) {

  const addValuesToSuiteInjections = function (k: string, val: any): void {
    if (k in suite.injectedValues) {
      throw new Error(` => Injection value '${k}' was used more than once; this value needs to be unique.`);
    }

    // freeze the property so it cannot be modified by user after the fact
    Object.defineProperty(suite.injectedValues, k, {
      enumerable: true,
      writable: false,
      configurable: true,
      value: val
    });
  };

  const isDescValid = function (desc: string) {
    return desc && String(desc) !== String(constants.UNKNOWN_INJECT_HOOK_NAME)
  };

  const injections = suite.getInjections();

  async.eachSeries(injections, function (inj: IInjectionObj, cb: Function) {

    let callable = true;

    const to = setTimeout(function () {
      first(new Error(` => Injection hook timeout. ${inj.desc && 'For injection with name => ' + inj.desc}`));
    }, weAreDebugging ? 5000000 : inj.timeout);

    const first = function (err: IPseudoError) {
      if (callable) {
        callable = false;
        clearTimeout(to);
        process.nextTick(cb, err);
      }
      else if (err) {
        _suman.log.error('Callback was called more than once, with error => \n', err.stack || err);
      }
    };

    const injParam = Object.create(tProto);
    const valuesMap = {} as any;

    injParam.registerKey = function (k: string, val: any): Promise<any> {
      assert(k && typeof k === 'string', 'key must be a string.');
      if (k in valuesMap) {
        throw new Error(`Injection key '${k}' has already been added.`);
      }
      if (k in suite.injectedValues) {
        throw new Error(`Injection key '${k}' has already been added.`);
      }
      return Promise.resolve(valuesMap[k] = val);
    };

    //TODO: ask SO what JS objects have key / values (is it iterable or no?)

    injParam.registerMap = function (o: Iterable<any>): Promise<Array<any>> {

      let keys : Array<string>;

      try{
        keys = Object.keys(o);
      }
      catch(err){
        _suman.log.error('Could not call Object.keys(o), where o is:', util.inspect(o));
        throw err;
      }

      return Promise.all(keys.map(function (k) {
        if (k in valuesMap) {
          throw new Error(`Injection key '${k}' has already been added.`);
        }
        if (k in suite.injectedValues) {
          throw new Error(`Injection key '${k}' has already been added.`);
        }
        return valuesMap[k] = o[k];
      }));
    };

    return new Promise(function (resolve, reject) {

      if (inj.cb) {

        let d = function (err: IPseudoError, results: IInjectionRetObj) {

          if (err) {
            return reject(err);
          }

          Promise.resolve(results).then(resolve, reject);
        };

        inj.fn.call(null, Object.setPrototypeOf(d, injParam));
      }

      else {

        Promise.resolve(inj.fn.call(null, injParam)).then(resolve, reject)

      }
    })
    .then(function () {

      return Promise.all(Object.keys(valuesMap).map(function (k) {
         return valuesMap[k];
      }));

    });

  }, cb);

};


