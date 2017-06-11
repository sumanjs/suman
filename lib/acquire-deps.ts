'use strict';
import Timer = NodeJS.Timer;
import {IDepContainer} from "../dts/integrant-value-container";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const _ = require('lodash');
const fnArgs = require('function-arguments');
const su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
const makeGen = require('./helpers/async-gen');

////////////////////////////////////////////////////////////////////


interface ICachedProm {
  [key: string]: Promise<any>
}

interface IAccum {
  [key: string]: any
}

let cachedPromises: ICachedProm = {}; // use Map instead? Map<string, Promise<any>> = new Map();

const customStringify = function (v: any) {
  let cache: Array<any> = [];
  return JSON.stringify(v, function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
};

////////////////////////////////////////////////////////////////////

export = function acquireDependencies(depList: Array<string>, depContainerObj: IDepContainer): Promise<any> {


  const getAllPromises = function (key: string, $deps: Array<any>): Promise<any> {

    let c;
    if (c = cachedPromises[key]) {
      return c;
    }

    const val = depContainerObj[key];
    let subDeps;
    let fn: Function;
    let timeout: number;  // default timeout
    let props: Array<string>;

    if (Array.isArray(val)) {
      fn = val[val.length - 1];
      val.pop();
      subDeps = val.filter(function (v) {
        if (String(v).indexOf(':') > -1) {
          props = props || [];
          props.push(v);
          return false;
        }
        return true;
      });
    }
    else {
      subDeps = [];
      fn = val;
    }

    // in case the user sets it to some weird falsey value
    if (!timeout || !Number.isInteger(timeout)) {
      timeout = 25000; // 15 seconds
    }

    console.log(' => Timeout is => ', timeout);

    $deps.forEach(function (d) {
      if (d === key) {
        throw new Error('Circular dependency => existing deps => ' + util.inspect($deps) + ', ' +
          'new dep => "' + key + '"');
      }
    });

    $deps.push(key);

    subDeps.forEach(function (d) {
      // here we attempt to catch circular dependencies earlier
      if ($deps.includes(d)) {
        throw new Error(' => Direct circular dependency => pre-existing deps => ' + util.inspect($deps) + ', ' +
          'newly required dep => "' + d + '"');
      }
    });

    const acc : IAccum = {}; // accumulated value

    return cachedPromises[key] = Promise.all(
      subDeps.map(function (k) {

        return getAllPromises(k, $deps.slice(0)).then(function (v) {
          acc[k] = v;
        });

      })
    ).then(function ($$vals) {

      // ignore $$vals, use acc instead

      let to: Timer;

      return new Promise(function (resolve, reject) {

        to = setTimeout(function () {
          reject(new Error('Suman dependency acquisition timed-out for dependency with key/id="' + key + '"'));
        }, _suman.weAreDebugging ? 5000000 : timeout);

        if (_suman.sumanOpts.verbose || su.isSumanDebug()) {
          console.log(' => Executing dep with key = "' + key + '"');
        }

        if (typeof fn !== 'function') {
          reject({
            key: key,
            error: new Error(' => Suman usage error => would-be function was undefined or otherwise ' +
              'not a function => ' + String(fn))
          });
        }
        else if (fn.length > 1 && su.isGeneratorFn(fn)) {
          reject(new Error(' => Suman usage error => function was a generator function but also took a callback' + String(fn)));
        }
        else if (su.isGeneratorFn(fn)) {
          const gen = makeGen(fn, null);
          gen.call(undefined, acc).then(resolve, function (e: Error | string) {
            reject({
              key: key,
              error: e
            });
          });
        }
        else if (fn.length > 1) {
          let args = fnArgs(fn);
          let str = fn.toString();
          let matches = str.match(new RegExp(args[1], 'g')) || [];
          if (matches.length < 2) {
            //there should be at least two instances of the 'cb' string in the function,
            // one in the parameters array, the other in the fn body.
            return reject({
              key: key,
              error: new Error(' => Suman usage error => Callback in your function was not present => ' + str)
            });
          }
          fn.call(undefined, acc, function (e: Error | string, val: any) { //TODO what to use for ctx of this .apply call?
            e ? reject({
              key: key,
              error: e
            }) : resolve(val);
          });
        }
        else {
          Promise.resolve(fn.call(undefined, acc)).then(resolve, function (e: Error | string) {
            reject({
              key: key,
              error: e
            });
          });
        }
      }).then(function (val) {
        clearTimeout(to);
        return {
          [key]: val
        };
      }, function (err) {
        clearTimeout(to);
        return Promise.reject(err);
      })
    });
  };

  const promises = depList.map(function (key) {
    return getAllPromises(key, []);
  });

  return Promise.all(_.flattenDeep(promises)).then(function (deps) {

    // Object.keys(depContainerObj).forEach(function (key, index) {
    //   depContainerObj[key] = deps[index];
    //   su.runAssertionToCheckForSerialization(depContainerObj[key]);
    // });

    // const ret = {};

    // Object.keys(depContainerObj).forEach(function (key, index) {
    //   depContainerObj[key] = deps[index];
    //   su.runAssertionToCheckForSerialization(depContainerObj[key]);
    // });

    return customStringify(deps);

  });
};
