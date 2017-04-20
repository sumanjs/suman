'use strict';
import {ITestSuite} from "../../dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

/////////////////////////////////////////////////////////////

export = function async(makeGenerator: Function, ctx: any) {

  return function () : Promise<any> {

    const generator = makeGenerator.apply(ctx, arguments);

    function handle(result: any) : Promise<any> {

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
    }

    try {
      return handle(generator.next());
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
