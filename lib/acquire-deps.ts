'use strict';
import Timer = NodeJS.Timer;
import {IDepContainer} from "../dts/integrant-value-container";
import {IPseudoError} from "../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const _ = require('lodash');
const fnArgs = require('function-arguments');
const su = require('suman-utils');
const colors = require('colors/safe');

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

///////////////////////////////////////////////////////////////

let cachedPromises: ICachedProm = {}; // use Map instead? Map<string, Promise<any>> = new Map();

///////////////////////////////////////////////////////////////

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

  const verbosity = _suman.sumanOpts.verbosity || 5;
  _suman.log('verbosity level => ', colors.magenta(verbosity));
  console.log('depList => ', depList);

  const getAllPromises = function (key: string, $deps: Array<any>): Promise<any> {

    if (cachedPromises[key]) {
      // if the promise has already been created, then just return that
      return cachedPromises[key];
    }

    if (verbosity > 3) {
      // only want to log this once, that's why we check cachedPromises for the key
      _suman.log(colors.cyan(`(suman.once.pre.js) => Beginning to source dep with key => '${key}'`));
    }

    const val = depContainerObj[key];
    let subDeps: Array<string>;
    let fn: Function;
    let timeout: number;  // default timeout
    let props: Array<string>;

    if (Array.isArray(val)) {
      fn = val[val.length - 1];
      val.pop();
      subDeps = val.filter(function (v) {
        if (v) {
          if (typeof v !== 'string') {
            throw new Error(' => There is a problem in your suman.once.pre.js file - ' +
              'the following key was not a string => ' + util.inspect(v));
          }
          if (String(v).indexOf(':') > -1) {
            props = props || [];
            props.push(v);
            return false;
          }
          return true;
        }
        else {
          console.error(' => You have an empty key in your suman.once.pre.js file.');
          console.error(' => Suman will continue optimistically.');
          return false;
        }
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

    if (verbosity > 6) {
      _suman.log(`Maximum time allocated to source dependency with key => '${key}' is => `, timeout);
    }

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

    const acc: IAccum = {}; // accumulated value

    return cachedPromises[key] = Promise.all(
      subDeps.map(function (k) {
        return getAllPromises(k, $deps.slice(0)).then(function (v) {
          // acc[k] = v;
          Object.assign(acc, v);
          // return v;
        });
      })
    ).then(function ($$vals) {

      console.log('acc =>', acc);
      console.log('$$vals =>', $$vals);
      // ignore $$vals, use acc instead

      if (verbosity > 5 && subDeps.length > 0) {
        _suman.log(colors.blue(`suman.once.pre.js => `
          + `Finished sourcing the dependencies ${util.inspect(subDeps)} of key => '${key}'`));
      }

      let to: Timer;

      return new Promise(function (resolve, reject) {

        to = setTimeout(function () {
          reject(new Error(`Suman dependency acquisition timed-out for dependency with key => '${key}'`));
        }, _suman.weAreDebugging ? 5000000 : timeout);

        if (verbosity > 5 || su.isSumanDebug()) {
          _suman.log('suman.once.pre.js => Executing dep with key = "' + key + '"');
        }

        if (typeof fn !== 'function') {
          reject({
            key,
            error: new Error(' => Suman usage error => would-be function was undefined or otherwise ' +
              'not a function => ' + String(fn))
          });
        }
        else if (fn.length > 1 && su.isGeneratorFn(fn)) {
          reject({
            key,
            error: new Error(' => Suman usage error => function was a generator function but also took a callback' + String(fn))
          });
        }
        else if (su.isGeneratorFn(fn)) {
          const gen = makeGen(fn, null);
          gen.call(null, acc).then(resolve, function (e: Error | string) {
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

          fn.call(null, acc, function (e: IPseudoError | string, val: any) {
            e ? reject({
              key: key,
              error: e
            }) : resolve(val);
          });
        }
        else {
          Promise.resolve(fn.call(undefined, acc)).then(resolve, function (e: IPseudoError | string) {
            reject({
              key: key,
              error: e
            });
          });
        }
      }).then(function (val) {

        clearTimeout(to);

        if (verbosity > 3 || su.isSumanDebug()) {
          _suman.log(colors.green.bold('suman.once.pre.js => Finished sourcing dep with key = "' + key + '"'));
        }

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

  // return Promise.all(_.flattenDeep(promises)).then(function (deps) {

  return Promise.all(promises).then(function (deps) {

    // Object.keys(depContainerObj).forEach(function (key, index) {
    //   depContainerObj[key] = deps[index];
    //   su.runAssertionToCheckForSerialization(depContainerObj[key]);
    // });

    // const ret = {};

    // Object.keys(depContainerObj).forEach(function (key, index) {
    //   depContainerObj[key] = deps[index];
    //   su.runAssertionToCheckForSerialization(depContainerObj[key]);
    // });

    console.log('deps => ', deps);

    const obj = deps.reduce(function (prev, curr) {
      return Object.assign(prev, curr);
    }, {});

    console.log('deps obj=> ', obj);

    _suman.log(colors.green.underline.bold('Finished with suman.once.pre.js dependencies.'));

    return customStringify(obj);

  }, function (err) {

    _suman.logError(colors.magenta('There was an error sourcing your dependencies in suman.once.pre.js.'));
    console.error(err.stack || err);
    return customStringify({});

  });
};
