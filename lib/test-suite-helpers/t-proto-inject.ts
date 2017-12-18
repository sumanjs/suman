'use strict';

//dts
import {IAssertObj, IHandleError, IHookObj, IHookParam} from "suman-types/dts/test-suite";
import {IGlobalSumanObj} from "suman-types/dts/global";
import AssertStatic = Chai.AssertStatic;
import {ITestSuite} from 'suman-types/dts/test-suite';
import {ErrorCallback, Dictionary} from 'async';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
const chai = require('chai');
const chaiAssert = chai.assert;

//npm
import su = require('suman-utils');
import async = require('async');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {tProto} from './t-proto';

////////////////////////////////////////////////////////////////////////////////////

interface IBadProps {
  [key: string]: true
}

let badProps = <IBadProps> {
  inspect: true,
  constructor: true
};

/////////////////////////////////////////////////////////////////////////////////

export const makeInjectObj = function (inject: IHookObj, assertCount: IAssertObj, suite: ITestSuite,
                                       values: Array<any>,
                                       handleError: IHandleError, fini: Function): IHookParam {
  
  let planCalled = false;
  const v = Object.create(tProto);
  const valuesMap = {} as any;
  
  v.__hook = inject;
  v.__handle = handleError;
  v.__fini = fini;
  
  
  v.registerKey = v.register = function (k: string, val: any): Promise<any> {
    assert(k && typeof k === 'string', 'key must be a string.');
    
    if (k in valuesMap) {
      throw new Error(`Injection key '${k}' has already been added.`);
    }
    if (k in suite.injectedValues) {
      throw new Error(`Injection key '${k}' has already been added.`);
    }
    
    valuesMap[k] = true; // mark as reserved
    values.push({k, val});
    return Promise.resolve(val);
  };
  
  v.registerFnsMap = v.registerFnMap = function (o: Dictionary<any>): Promise<any> {
    
    assert(su.isObject(o), 'value must be a non-array object.');
    
    return new Promise(function (resolve, reject) {
      
      debugger;
      
      async.series(o, function (err: Error, results: Dictionary<any>) {
        
        console.log('err => ', err);
        console.log('results => ', results);
        
        if (err) {
          return reject(err);
        }
        
        Object.keys(results).forEach(function (k) {
          if (k in valuesMap) {
            return reject(new Error(`Injection key '${k}' has already been added.`));
          }
          if (k in suite.injectedValues) {
            return reject(new Error(`Injection key '${k}' has already been added.`));
          }
          
          valuesMap[k] = true; // mark as reserved
          values.push({k, val: results[k]});
        });
        
        resolve(results);
      });
    });
  };
  
  v.registerMap = v.registerPromisesMap = function (o: Dictionary<any>): Promise<Array<any>> {
    
    let keys = Object.keys(o);
    return Promise.all(keys.map(function (k) {
      
      if (k in valuesMap) {
        throw new Error(`Injection key '${k}' has already been added.`);
      }
      if (k in suite.injectedValues) {
        throw new Error(`Injection key '${k}' has already been added.`);
      }
      
      valuesMap[k] = true; // mark as reserved
      values.push({k, val: o[k]});
      return o[k];
    }));
  };

  
  v.plan = function (num: number) {
    if (planCalled) {
      _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
      return;
    }
    
    planCalled = true;
    if (inject.planCountExpected !== undefined) {
      _suman.writeTestError(new Error(' => Suman warning => plan() called, even though plan was already passed as an option.').stack);
    }
    
    assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
    inject.planCountExpected = v.planCountExpected = num;
  };
  
  v.confirm = function () {
    assertCount.num++;
  };
  
  return v;
  
};

