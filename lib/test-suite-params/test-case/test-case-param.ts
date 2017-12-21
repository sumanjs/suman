'use strict';

//dts
import {IGlobalSumanObj} from 'suman-types/dts/global';
import {ITestDataObj} from 'suman-types/dts/it';
import {IHandleError, ITestCaseParam} from 'suman-types/dts/test-suite';
import AssertStatic = Chai.AssertStatic;

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import util = require('util');

//npm
const chai = require('chai');
const chaiAssert = chai.assert;

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {ParamBase} from '../base';

//////////////////////////////////////////////////////////////////////

export interface IAssertCount {
  num: number
}


///////////////////////////////////////////////////////////////////////

export class TestCaseParam extends ParamBase {
  
  constructor(test: ITestDataObj, assertCount: IAssertCount,
              handleError: IHandleError, fini: Function) {
    super();
    
    this.assertCount = assertCount;
    this.planCalled = false;
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
    
    if (this.planCalled) {
      _suman.writeTestError(new Error('Suman warning => t.plan() called more than once for ' +
        'the same test case.').stack);
      return;
    }
    
    this.planCalled = true;
    if (test.planCountExpected !== undefined) {
      _suman.writeTestError(new Error('Suman warning => t.plan() called, even though plan ' +
        'was already passed as an option.').stack);
    }
    
    assert(Number.isInteger(num), 'Suman usage error => value passed to t.plan() is not an integer.');
    test.planCountExpected = this.planCountExpected = num;
    
  }
  
  confirm() {
    this.assertCount.num++;
  }
  
}



