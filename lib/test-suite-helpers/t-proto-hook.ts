'use strict';

//dts
import {IAssertObj, IHandleError, IHookObj} from "../dts/test-suite";
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
const chai = require('chai');
const chaiAssert = chai.assert;

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
import {tProto} from './t-proto';


/////////////////////////////////////////////////////////////////////////////////

export const makeHookObj = function (hook: IHookObj, assertCount: IAssertObj) {

  let planCalled = false;

  function H(handleError: IHandleError) {

    this.__handle = handleError;

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

  /*
   !!!
   IMPORTANT NOTE: do not make any references to "this" in any prototype function because "this" may not be bound if the
   the user passes the function directly, and does not call the function with "t" as in "t.x()" but instead
   just calls "x()"
   */

  H.prototype = Object.create(tProto);

  H.prototype.plan = function _plan(num: number) {
    if (!planCalled) {
      planCalled = true;
      if (hook.planCountExpected !== undefined) {
        _suman.writeTestError(new Error(' => Suman warning => t.plan() called, even though plan was already passed as an option.').stack);
      }
      assert(Number.isInteger(num), ' => Suman usage error => value passed to t.plan() is not an integer.');
      hook.planCountExpected = num;
    }
    else {
      _suman.writeTestError(new Error(' => Suman warning => t.plan() called twice.').stack);
    }
  };

  H.prototype.confirm = function _confirm() {
    assertCount.num++;
  };

  return H;

};

