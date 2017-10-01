'use strict';

//dts
import {IAssertObj, IHandleError, IHookObj, IHookParam} from "suman-types/dts/test-suite";
import {IGlobalSumanObj} from "suman-types/dts/global";
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
import {tProto} from './t-proto';

////////////////////////////////////////////////////////////////////////////////////

interface IBadProps {
  [key: string]: true
}

let badProps = <IBadProps> {
  inspect: true,
  constructor: true
};

/////////////////////////////////////////////////////////////////////////////////

export const makeHookObj = function (hook: IHookObj, assertCount: IAssertObj, handleError: IHandleError): IHookParam {

  let planCalled = false;
  const v = Object.create(tProto);

  const assrt = <Partial<AssertStatic>>  function () {
    try {
      return chaiAssert.apply(chaiAssert, arguments);
    }
    catch (e) {
      return handleError(e);
    }
  };

  v.assert = new Proxy(assrt, {
    get: function (target, prop) {

      if (typeof prop === 'symbol') {
        return Reflect.get(...arguments);
      }

      // if (badProps[String(prop)]) {
      //   return Reflect.get(...arguments);
      // }

      if (!(prop in chaiAssert)) {

        try {
          return Reflect.get(...arguments);
        }
        catch(err){
          return handleError(
            new Error(`The assertion library used does not have a '${prop}' property or method.`)
          );
        }
      }

      return function () {
        try {
          return chaiAssert[prop].apply(chaiAssert, arguments);
        }
        catch (e) {
          return handleError(e);
        }
      }
    }
  });

  v.plan = function (num: number) {
    if (planCalled) {
      _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
      return;
    }

    planCalled = true;
    if (hook.planCountExpected !== undefined) {
      _suman.writeTestError(new Error(' => Suman warning => plan() called, even though plan was already passed as an option.').stack);
    }

    assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
    hook.planCountExpected = v.planCountExpected = num;
  };

  v.confirm = function () {
    assertCount.num++;
  };

  return v;

};

