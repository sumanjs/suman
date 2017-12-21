'use strict';

//dts
import {IAssertObj, IHandleError, IHookObj, IHookParam} from 'suman-types/dts/test-suite';
import {IGlobalSumanObj} from 'suman-types/dts/global';
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
import {ParamBase} from '../base';

////////////////////////////////////////////////////////////////////////////////////

interface IBadProps {
  [key: string]: true
}

let badProps = <IBadProps> {
  inspect: true,
  constructor: true
};


export class InjectParam extends  ParamBase{
  
  constructor(inject: IHookObj, assertCount: IAssertObj, suite: ITestSuite,
              values: Array<any>, handleError: IHandleError, fini: Function){
    
    super();
    this.__planCalled = false;
    this.__valuesMap = {} as any;
    this.__suite = suite;
    this.__hook = inject;
    this.__handle = handleError;
    this.__fini = fini;
    this.__values = values;
    this.__inject = inject;
  }
  
  
  registerKey (k: string, val: any): Promise<any> {   //  'register' should be an alias?
    
    const suite  = this.__suite;
    const valuesMap = this.__valuesMap;
    const values = this.__values;
    
    try {
      assert(k && typeof k === 'string', 'key must be a string.');
    }
    catch (err) {
      return this.__handle(err);
    }
    
    if (k in valuesMap) {
      return this.__handle(new Error(`Injection key '${k}' has already been added.`));
    }
    if (k in suite.injectedValues) {
      return this.__handle(new Error(`Injection key '${k}' has already been added.`));
    }
    
    valuesMap[k] = true; // mark as reserved
    values.push({k, val});
    return Promise.resolve(val);
  }
  
  registerFnMap (o: Dictionary<any>): Promise<any> { // 'registerFnsMap' shoule be an alias
  
    const suite  = this.__suite;
    const valuesMap = this.__valuesMap;
    const values = this.__values;
    const self = this;
    
    return new Promise(function (resolve, reject) {
      
      assert(su.isObject(o), 'value must be a non-array object.');
      
      async.series(o, function (err: Error, results: Dictionary<any>) {
        
        if (err) {
          return reject(err);
        }
        
        try {
          Object.keys(results).forEach(function (k) {
            if (k in valuesMap) {
              throw new Error(`Injection key '${k}' has already been added.`);
            }
            if (k in suite.injectedValues) {
              throw new Error(`Injection key '${k}' has already been added.`);
            }
            valuesMap[k] = true; // mark as reserved
            values.push({k, val: results[k]});
          });
        }
        catch (err) {
          return reject(err);
        }
        
        resolve(results);
      });
    })
    .catch(function (err) {
      return self.__handle(err);
    });
  }
  
  registerMap (o: Dictionary<any>): Promise<Array<any>> { // 'registerPromisesMap' should be an alias
  
    const suite  = this.__suite;
    const valuesMap = this.__valuesMap;
    const values = this.__values;
    const keys = Object.keys(o);
    const self = this;
    let registry;
    
    try {
      registry = keys.map(function (k) {
        
        if (k in valuesMap) {
          throw new Error(`Injection key '${k}' has already been added.`);
        }
        if (k in suite.injectedValues) {
          throw new Error(`Injection key '${k}' has already been added.`);
        }
        
        valuesMap[k] = true; // mark as reserved
        values.push({k, val: o[k]});
        return o[k];
      });
    }
    catch (err) {
      return self.__handle(err);
    }
    
    return Promise.all(registry)
    .catch(function (err) {
      return self.__handle(err);
    });
  }
  
  plan (num: number) {
    
    if (this.__planCalled) {
      _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
      return;
    }
    
    this.__planCalled = true;
    if (this.__inject.planCountExpected !== undefined) {
      _suman.writeTestError(
        new Error(' => Suman warning => plan() called, even though plan was already passed as an option.').stack
      );
    }
    
    try {
      assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
    }
    catch (err) {
      return this.__handle(err);
    }
    
    this.__inject.planCountExpected = this.planCountExpected = num;
  }
  
  confirm = function () {
    this.assertCount.num++;
  }
  
}




