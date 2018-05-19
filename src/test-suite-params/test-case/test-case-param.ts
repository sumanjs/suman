'use strict';

//dts
import {IAssertObj, ITimerObj} from "suman-types/dts/general";
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {ITestDataObj} from 'suman-types/dts/it';
import {IHandleError} from 'suman-types/dts/test-suite';
import {ITestCaseParam} from 'suman-types/dts/params';
import AssertStatic = Chai.AssertStatic;

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import util = require('util');

//npm
import * as chai from 'chai';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {ParamBase} from '../base';
import {constants} from "../../config/suman-constants";
import {cloneError} from "../../helpers/general";

//////////////////////////////////////////////////////////////////////////////

export interface IAssertCount {
  num: number
}

///////////////////////////////////////////////////////////////////////////////

export class TestCaseParam extends ParamBase implements ITestCaseParam {
  
  protected __planCalled: boolean;
  protected __assertCount: IAssertCount;
  protected planCountExpected: number;
  protected value: Object;
  protected data: Object;
  protected testId: number;
  protected desc: string;
  protected title: string;
  protected __test: ITestDataObj;
  
  constructor(test: ITestDataObj, assertCount: IAssertCount, handleError: IHandleError,
              fini: Function, timerObj: ITimerObj) {
    super();
    
    this.__assertCount = assertCount;
    this.__planCalled = false;
    this.value = test.value;
    this.testId = test.testId;
    this.desc = this.title = test.desc;
    this.data = test.data;
    this.__test = test;
    this.__handle = handleError;
    this.__fini = fini;
    const v = this.__timerObj = timerObj;
    const amount = _suman.weAreDebugging ? 5000000 : test.timeout;
    v.timer = setTimeout(this.onTimeout.bind(this), amount) as any;
  
    // const self = this;
    // process.nextTick(() => {
    //   self.__tooLate = true;
    // });
  }
  
  skip() {
    this.__test.skipped = true;
    this.__test.dynamicallySkipped = true;
  }
  
  onTimeout() {
    const v = this.__test;
    v.timedOut = true;
    const err = cloneError(v.warningErr, constants.warnings.TEST_CASE_TIMED_OUT_ERROR);
    err.isFromTest = true;
    err.isTimeout = true;
    this.__handle(err);
  }
  
  __inheritedSupply(target: any, prop: PropertyKey, value: any, receiver: any) {
    this.__handle(new Error('cannot set any properties on t.supply (in test cases).'));
    return true;
  }
  
  plan(num: number) {
    
    const test = this.__test;
    
    if (this.__planCalled) {
      _suman.writeTestError(new Error('Suman warning => t.plan() called more than once for ' +
        'the same test case.').stack);
      return;
    }
    
    this.__planCalled = true;
    if (test.planCountExpected !== undefined) {
      _suman.writeTestError(new Error('Suman warning => t.plan() called, even though plan ' +
        'was already passed as an option.').stack);
    }
    
    assert(Number.isInteger(num), 'Suman usage error => value passed to t.plan() is not an integer.');
    test.planCountExpected = this.planCountExpected = num;
  }
  
  confirm() {
    this.__assertCount.num++;
  }
  
}



