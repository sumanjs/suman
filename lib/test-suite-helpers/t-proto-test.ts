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
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
import {tProto} from './t-proto';

//////////////////////////////////////////////////////////////////////

export interface IAssertCount {
  num: number
}

///////////////////////////////////////////////////////////////////////

export const makeTestCase = function (test: ITestDataObj, assertCount: IAssertCount) {

  //  !!!
  //
  // IMPORTANT NOTE: do not make any references to "this" in any prototype function because "this" may not be bound if the
  // the user passes the function directly, and does not call the function with "t" as in "t.x()" but instead
  // just calls "x()"

  function T(handleError: Function) {
    this.__handle = handleError;
    this.value = test.value;
    this.testId = test.testId;
    this.desc = this.title = test.desc;
    this.data = test.data;

    this.assert = function () {
      try {
        return chaiAssert.apply(this, arguments);
      }
      catch (e) {
        return this.__handle(e, false);
      }
    };

    const self = this;
    Object.keys(chaiAssert).forEach(key => {
      self.assert[key] = function () {
        try {
          return chaiAssert[key].apply(chaiAssert, arguments);
        }
        catch (e) {
          return self.__handle(e, false);
        }
      }
    });
  }

  T.prototype = Object.create(tProto);

  let planCalled = false;

  T.prototype.plan = function (num: number) {
    if (!planCalled) {
      planCalled = true;
      if (test.planCountExpected !== undefined) {
        _suman.writeTestError(new Error(' => Suman warning => t.plan() called, even though plan ' +
          'was already passed as an option.').stack);
      }
      assert(Number.isInteger(num), ' => Suman usage error => value passed to t.plan() is not an integer.');
      test.planCountExpected = num;
    }
    else {
      _suman.writeTestError(new Error(' => Suman warning => t.plan() called more than once for ' +
        'the same test case.').stack);
    }
  };

  T.prototype.confirm = function () {
    assertCount.num++;
  };

  return T;

};

