'use strict';

//dts
import {IInjectionObj, ITestSuite} from "suman-types/dts/test-suite";
import {IPseudoError, IGlobalSumanObj} from "suman-types/dts/global";
import {ErrorCallback, Dictionary} from 'async';

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

export const handleInjections = function (suite: ITestSuite, cb: ErrorCallback<any>) {

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
      first(new Error(`Injection hook timeout. ${'For injection with name => ' + inj.desc}`));
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

    return new Promise(function (resolve, reject) {

      injParam.registerKey = injParam.register = function (k: string, val: any): Promise<any> {
        assert(k && typeof k === 'string', 'key must be a string.');
        {
          if (k in valuesMap) {
            throw new Error(`Injection key '${k}' has already been added.`);
          }
          if (k in suite.injectedValues) {
            throw new Error(`Injection key '${k}' has already been added.`);
          }
        }
        return Promise.resolve(valuesMap[k] = val);
      };

      //TODO: ask SO what JS objects have key / values (is it iterable or no?)
      injParam.registerFnsMap = injParam.registerFnMap = function (o: Dictionary<any>): Promise<any> {
        return new Promise(function (resolve, reject) {
          async.series(o, function (err: Error, results: Dictionary<any>) {

            console.log('err => ', err);
            console.log('results => ', results);

            if (err) return reject(err);

            {
              Object.keys(results).forEach(function (k) {
                if (k in valuesMap) {
                  return reject(new Error(`Injection key '${k}' has already been added.`));
                }
                if (k in suite.injectedValues) {
                  return reject(new Error(`Injection key '${k}' has already been added.`));
                }
                return valuesMap[k] = results[k];
              });
            }
            resolve(results);
          });
        })
        .catch(reject);
      };

      injParam.registerMap = injParam.registerPromisesMap = function (o: Dictionary<any>): Promise<Array<any>> {

        let keys = Object.keys(o);

        return Promise.all(keys.map(function (k) {

          {
            if (k in valuesMap) {
              throw new Error(`Injection key '${k}' has already been added.`);
            }
            if (k in suite.injectedValues) {
              throw new Error(`Injection key '${k}' has already been added.`);
            }
          }

          return valuesMap[k] = o[k];

        }));
      };

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
      const keys = Object.keys(valuesMap);
      return Promise.all(keys.map(function (k) {
        return valuesMap[k];
      }))
      .then(function (values) {

        keys.forEach(function (k, i) {
          addValuesToSuiteInjections(k, values[i]);
        });

        first(null);

      });
    })
    .catch(first);

  }, cb);

};


