'use strict';

//dts
import {ITestSuite} from "suman-types/dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

/////////////////////////////////////////////////////////////

export const makeRunGenerator =  function (fn: Function, ctx: any) {

  return function (): Promise<any> {

    const generator = fn.apply(ctx, arguments);

    const handle = function (result: any): Promise<any> {

      // result => { done: [Boolean], value: [Object] }
      if (result.done) {
        return Promise.resolve(result.value);
      }
      else {
        return Promise.resolve(result.value).then(function (res) {
          return handle(generator.next(res));
        }, function (e) {
          return handle(generator.throw(e));
        });
      }
    };

    try {
      return handle(generator.next());
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
