'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {ITestSuite} from "suman-types/dts/test-suite";

//core
const assert = require('assert');

//npm
const pragmatik = require('pragmatik');

///////////////////////////////////////////////////////////////////////////////////////////

export const makeProxy = function (suman: ISuman): Function {

  return function getProxy(method: Function, rule: Object, props?: Array<string>): Function {

    /*
    NOTE
     this function allows us to dynamically generate functions such as
     => after.last.always.skip();
     this way we only create the functions we need, instead of enumerating them all here.
     this makes for a leaner and more maintenable codebase as well as higher performance.
    */

    ///////////////////////////////////////////////////////

    return new Proxy(method, {
      get: function (target, prop) {

        props = props || [];
        let hasSkip = false;
        let newProps = props.concat(String(prop))
        .map(v => String(v).toLowerCase()) // we map to lowercase first, so we can use indexOf afterwards
        .filter(function (v, i, a) {
          if (v === 'skip') {  // if skip, none of the other properties matter
            hasSkip = true;
          }
          return a.indexOf(v) === i;  // we use this filter to get a unique list
        })
        // sort the properties alphabetically so that we need to use fewer number of caches
        .sort();

        if (hasSkip) {
          // if any of the props are "skip" then we can reduce it to just "skip"
          newProps = ['skip'];
        }

        let cache, cacheId = newProps.join('-');

        let fnCache = suman.testBlockMethodCache.get(method);
        if (!fnCache) {
          fnCache = {};
          suman.testBlockMethodCache.set(method, fnCache);
        }

        if (cache = suman.testBlockMethodCache.get(method)[cacheId]) {
          return cache;
        }

        let fn = function () {

          let args = pragmatik.parse(arguments, rule);

          newProps.forEach(function (p) {
            args[1][p] = true;
          });

          args[1].__preParsed = true;
          // assert.equal(suman.ctx, ctx, 'Fatal usage error - test block method was registered asynchronously.');
          return method.apply(null, args);
        };

        return fnCache[cacheId] = getProxy(fn, rule, newProps);
      }
    });
  };

};
