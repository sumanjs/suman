'use strict';

//dts
import {IGlobalSumanObj} from "../../dts/global";
import {ITestDataObj} from "../../dts/it";

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
import {tProto} from './t-proto';
import {IHandleError} from "../../dts/test-suite";

//////////////////////////////////////////////////////////////////////

export interface IAssertCount {
  num: number
}

///////////////////////////////////////////////////////////////////////

export const makeTestCase = function (test: ITestDataObj, assertCount: IAssertCount, handleError: IHandleError) {

  let planCalled = false;
  const v = Object.create(tProto);
  v.value = test.value;
  v.testId = test.testId;
  v.desc = v.title = test.desc;
  v.data = test.data;

  v.assert = function () {
    try {
      return chaiAssert.apply(v, arguments);
    }
    catch (e) {
      return handleError(e);
    }
  };

  Object.keys(chaiAssert).forEach(key => {
    v.assert[key] = function () {
      try {
        return chaiAssert[key].apply(chaiAssert, arguments);
      }
      catch (e) {
        return handleError(e);
      }
    }
  });

  v.plan = function (num: number) {

    if (planCalled) {
      _suman.writeTestError(new Error(' => Suman warning => t.plan() called more than once for ' +
        'the same test case.').stack);
      return;
    }

    planCalled = true;
    if (test.planCountExpected !== undefined) {
      _suman.writeTestError(new Error(' => Suman warning => t.plan() called, even though plan ' +
        'was already passed as an option.').stack);
    }

    assert(Number.isInteger(num), ' => Suman usage error => value passed to t.plan() is not an integer.');
    test.planCountExpected = v.planCountExpected = num;

  };

  v.confirm = function () {
    assertCount.num++;
  };

  return v;

};

