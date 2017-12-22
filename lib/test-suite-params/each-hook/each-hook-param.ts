'use strict';

//dts
import {IAssertObj, IHandleError, IHookObj, IHookParam} from 'suman-types/dts/test-suite';
import {IGlobalSumanObj} from 'suman-types/dts/global';
import AssertStatic = Chai.AssertStatic;

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
const chai = require('chai');
const chaiAssert = chai.assert;

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

/////////////////////////////////////////////////////////////////////////

export class EachHookParam extends ParamBase {
  
  protected __planCalled: boolean;
  protected __assertCount: IAssertObj;
  protected planCountExpected: number;
  
  constructor(hook: IHookObj, assertCount: IAssertObj,
              handleError: IHandleError, fini: Function) {
    
    super();
    
    this.__planCalled = false;
    this.__hook = hook;
    this.__handle = handleError;
    this.__fini = fini;
    this.__assertCount = assertCount;
    
  }
  
  plan(num: number) {
    
    if (this.__planCalled) {
      _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
      return;
    }
    
    const hook = this.__hook;
    this.__planCalled = true;
    
    if (hook.planCountExpected !== undefined) {
      _suman.writeTestError(new Error(' => Suman warning => plan() called, even though plan was already passed as an option.').stack);
    }
    
    try {
      assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
    }
    catch (err) {
      return this.__handle(err);
    }
    
    hook.planCountExpected = this.planCountExpected = num;
  }
  
  confirm() {
    this.__assertCount.num++;
  }
  
}


