'use strict';

//dts
import {IAssertObj, IHandleError, IHookObj} from "../../dts/test-suite";
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');

const chai = require('chai');
const chaiAssert = chai.assert;

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {tProto} from './t-proto';

/////////////////////////////////////////////////////////////////////////////////

export const makeHookObj = function (hook: IHookObj, assertCount: IAssertObj, handleError: IHandleError) {

  let planCalled = false;
  const v = Object.create(tProto);

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
      _suman.writeTestError(new Error(' => Suman warning => plan() called more than once.').stack);
      return;
    }

    planCalled = true;
    if (hook.planCountExpected !== undefined) {
      _suman.writeTestError(new Error(' => Suman warning => t.plan() called, even though plan was already passed as an option.').stack);
    }

    assert(Number.isInteger(num), ' => Suman usage error => value passed to plan() is not an integer.');
    hook.planCountExpected = v.planCountExpected = num;
  };

  v.confirm = function () {
    assertCount.num++;
  };

  return v;

};

