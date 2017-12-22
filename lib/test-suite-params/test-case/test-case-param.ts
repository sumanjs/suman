'use strict';

//dts
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
  
  constructor(test: ITestDataObj, assertCount: IAssertCount,
              handleError: IHandleError, fini: Function) {
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



