'use strict';

//dts
import {IHandleError, IHookObj} from 'suman-types/dts/test-suite';
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {IAllHookParam} from 'suman-types/dts/params';
import {IAssertObj, ITimerObj} from "suman-types/dts/general";

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


export class AllHookParam extends ParamBase implements IAllHookParam {
  
  protected __planCalled: boolean;
  protected __assertCount: IAssertObj;
  protected planCountExpected: number;
  
  constructor(hook: IHookObj, assertCount: IAssertObj, handleError: IHandleError,
              fini: Function, timerObj: ITimerObj, onTimeout: Function) {
    
    super();
    
    this.planCountExpected = null;
    this.__planCalled = false;
    this.__hook = hook;
    this.__handle = handleError;
    this.__fini = fini;
    this.__assertCount = assertCount;
    this.__timerObj = timerObj;
    this.__onTimeout = onTimeout;
    
  }
  
  ctn(err: any) {
    this.callbackMode ? this.__fini(null) : this.handleNonCallbackMode(err);
  }
  
  pass(err: any) {
    this.callbackMode ? this.__fini(null) : this.handleNonCallbackMode(err);
  }
  
  plan(num: number) {
    
    if (this.__planCalled) {
      _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
      return;
    }
    
    const hook = this.__hook;
    this.__planCalled = true;
    
    if (hook.planCountExpected !== undefined) {
      _suman.writeTestError(new Error('Suman warning => plan() called, even though plan was already passed as an option.').stack);
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


