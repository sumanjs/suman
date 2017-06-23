'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');

//npm
const chai = require('chai');
const chaiAssert = chai.assert;

//project
const _suman = global.__suman = (global.__suman || {});
const proto = require('./t-proto');

///////////////////////////////////////////////////////////////////////

function makeT(test, assertCount) {

  //  !!!
  //
  // IMPORTANT NOTE: do not make any references to "this" in any prototype function because "this" may not be bound if the
  // the user passes the function directly, and does not call the function with "t" as in "t.x()" but instead
  // just calls "x()"

  function T(handleError) {
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
    Object.keys(chaiAssert).forEach((key) => {
      self.assert[key] = function () {
        try {
          return chaiAssert[key].apply(chaiAssert, arguments);
        }
        catch (e) {
          debugger;
          return self.__handle(e, false);
        }
      }
    });
  }

  T.prototype = Object.create(proto);

  let planCalled = false;

  T.prototype.plan = function _plan(num) {
    if (!planCalled) {
      planCalled = true;
      if (test.planCountExpected !== undefined) {
        _suman._writeTestError(new Error(' => Suman warning => t.plan() called, even though plan ' +
          'was already passed as an option.').stack);
      }
      assert(Number.isInteger(num), ' => Suman usage error => value passed to t.plan() is not an integer.');
      test.planCountExpected = num;
    }
    else {
      _suman._writeTestError(new Error(' => Suman warning => t.plan() called more than once for ' +
        'the same test case.').stack);
    }
  };

  T.prototype.confirm = function _confirm() {
    assertCount.num++;
  };

  return T;

}

module.exports = makeT;
