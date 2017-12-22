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
// import {makeInjectParam} from './t-proto-inject';
import {InjectParam} from "../test-suite-params/inject/inject-param";
import {constants} from "../../config/suman-constants";
const weAreDebugging = su.weAreDebugging;

///////////////////////////////////////////////////////////////////

interface IInjectionRetObj {
  [key: string]: any
}

interface IInjectionValues {
  k: string,
  val: any
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
    
    let callable = true, timeoutVal = weAreDebugging ? 5000000 : inj.timeout;
    
    let onTimeout = function () {
      first(new Error(`Injection hook timeout. ${'For injection with name => ' + inj.desc}`));
    };
  
    const timerObj = {
      timer: setTimeout(onTimeout, timeoutVal)
    };
    
    // const to = setTimeout(, timeoutVal);
    
    const first = function (err: IPseudoError) {
      if (callable) {
        callable = false;
        clearTimeout(timerObj.timer);
        process.nextTick(cb, err);
      }
      else if (err) {
        _suman.log.error('Callback was called more than once, with the following error:');
        _suman.log.error(err.stack || err);
      }
    };
    
    const values: Array<IInjectionValues> = [];
    const assertCount = {num: 0};
    
    return new Promise(function (resolve, reject) {
      
      const injParam = new InjectParam(inj, assertCount, suite, values, reject, resolve);
  
      injParam.fatal = reject;
      
      if (inj.cb) {
        
        let d = function (err: IPseudoError, results: IInjectionRetObj) {
          
          if (err) {
            return reject(err);
          }
          
          Promise.resolve(results).then(resolve, reject);
        };
  
        injParam.done = d;
        injParam.ctn = resolve;
        injParam.fail = reject;
        
        inj.fn.call(null, Object.setPrototypeOf(d, injParam));
      }
      else {
        
        Promise.resolve(inj.fn.call(null, injParam))
        .then(function () {
          return values.reduce(function (a, b) {
            //run promises in series
            return Promise.resolve(b.val)
          }, null);
        })
        .then(
          resolve,
          reject
        );
        
      }
    })
    .then(function () {
      
      // const keys = Object.keys(valuesMap);
      // return Promise.all(keys.map(function (k) {
      //   return valuesMap[k];
      // }))
      // .then(function (values) {
      //
      //   keys.forEach(function (k, i) {
      //     addValuesToSuiteInjections(k, values[i]);
      //   });
      //
      //   first(null);
      //
      // });
      
      const seed = Promise.resolve(null);
      
      const p = values.reduce(function (a, b) {
        //run promises in series
        return Promise.resolve(b.val)
        .then(function (v) {
          return addValuesToSuiteInjections(b.k, v);
        });
      }, seed);
      
      return p.then(function () {
        first(null);
      });
    })
    .catch(first);
    
  }, cb);
  
};


