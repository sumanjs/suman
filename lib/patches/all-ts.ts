'use strict';
import {IPseudoError} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');
const assert = require('assert');

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////

interface Newable<T> {
  new (executor: Function): T;
}

const PConstructor : Newable<Promise<any>> = global.Promise;

// const Promise = global.Promise = class PatchedPromise extends PConstructor {
//   constructor(executor: Function) {
//     if (process.domain) {
//       executor = executor && process.domain.bind(executor);
//     }
//     super(executor); // call native Promise constructor
//   }
// };


const then = Promise.prototype.then;
Promise.prototype.then = function (fn1: Function, fn2: Function) {

  if (process.domain) {
    fn1 = fn1 && process.domain.bind(fn1);
    fn2 = fn2 && process.domain.bind(fn2);
  }

  return then.call(this, fn1, fn2);
};

const katch = Promise.prototype.catch;
Promise.prototype.catch = function (fn1: Function) {
  if (process.domain) {
    fn1 = fn1 && process.domain.bind(fn1);
  }
  return katch.call(this, fn1);
};

/*

5..times(function (val) {
  console.log(val);
});


"5".times(function (val) {
  console.log(val);
});

*/

// add a MF utility method to Number.prototype and String.prototype
String.prototype.times = Number.prototype.times = function (callback: Function) {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback is not a function');
  } else if (isNaN(parseInt(Number(this.valueOf())))) {
    throw new TypeError('Object/value is not a valid number');
  }
  for (let i = 0; i < Number(this.valueOf()); i++) {
    callback(i);
  }
};

/////// monkey patch process#exit FTMFW

const exit = process.exit;

process.exit = function (code: number, fn: Function) {

  if (fn) {

    if (typeof fn !== 'function') {
      throw new Error(' => Suman internal implementation error => Please report ASAP, thanks.');
    }

    setTimeout(function () {
      console.error(' => Function timeout.');
      exit.call(process, (code || 1));
    }, 15000);

    fn(function (err: IPseudoError, c: number) {
      if (err) {
        exit.call(process, (c || code || 1));
      }
      else {
        exit.call(process, (c || code || 0));
      }
    });
  }
  else {
    exit.call(process, code);
  }
};

/////////////////////////////////////////////

Function.prototype.adhere = function () {

  let self = this;
  let args1 = Array.from(arguments);

  return function () {

    let args2 = Array.from(arguments);
    return self.apply(this, args1.concat(args2));
  }

};

/////////////////////////////////////////////////////

Array.prototype.mapToObject = function (fn) {

  let obj = {};

  for (let i = 0; i < this.length; i++) {

    let ret;

    if (fn) {
      ret = fn.call(this, this[i], i);
    }
    else {
      ret = this[i];
    }

    let keys = Object.keys(ret);
    assert(keys.length, ' => Object needs keys.');

    for (let j = 0; j < keys.length; j++) {
      const k = keys[j];
      obj[k] = ret[k];
    }

  }

  return obj;

};
