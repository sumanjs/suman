'use strict';

//dts
import {IAssertObj, ITimerObj} from "suman-types/dts/general";
import {IHandleError, IHookObj} from 'suman-types/dts/test-suite';
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {IEachHookParam} from 'suman-types/dts/params';
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
import {constants} from "../../config/suman-constants";
import {cloneError} from "../../helpers/general";

////////////////////////////////////////////////////////////////////////////////////

interface IBadProps {
  [key: string]: true
}

let badProps = <IBadProps> {
  inspect: true,
  constructor: true
};

/////////////////////////////////////////////////////////////////////////

export class EachHookParam extends ParamBase implements IEachHookParam {
  
  protected __planCalled: boolean;
  protected __assertCount: IAssertObj;
  protected planCountExpected: number;
  protected __hook: IHookObj;
  
  constructor(hook: IHookObj, assertCount: IAssertObj, handleError: IHandleError, fini: Function, timerObj: ITimerObj) {
    
    super();
    this.__planCalled = false;
    this.__hook = hook;
    this.__handle = handleError;
    this.__fini = fini;
    this.__assertCount = assertCount;
    const v = this.__timerObj = timerObj;
    const amount = _suman.weAreDebugging ? 5000000 : hook.timeout;
    const fn = this.onTimeout.bind(this);
    v.timer = setTimeout(fn,amount) as any;
  
    // const self = this;
    // process.nextTick(() => {
    //   // at this point, we can no longer call this.timeout(), etc.
    //   self.__tooLate = true;
    // });
  }
  
  skip() {
    (this.__hook).skipped = true;
    (this.__hook).dynamicallySkipped = true;
  }
  
  onTimeout () {
    const v = this.__hook;
    v.timedOut = true;
    const err = cloneError(v.warningErr, constants.warnings.HOOK_TIMED_OUT_ERROR);
    err.isTimeout = true;
    this.__handle(err);
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


