'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');
const assert = require('assert');

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////

const then = Promise.prototype.then;
Promise.prototype.then = function (fn1, fn2) {

  if (process.domain) {
    fn1 = fn1 && process.domain.bind(fn1);
    fn2 = fn2 && process.domain.bind(fn2);
  }

  return then.call(this, fn1, fn2);
};

// add a MF utility method to Number.prototype and String.prototype
String.prototype.times = Number.prototype.times = function (callback) {
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
process.exit = function (code, fn) {

  if (fn) {

    if (typeof fn !== 'function') {
      throw new Error(' => Suman internal implementation error => Please report ASAP, thanks.');
    }

    fn(function (err, c) {
      if (err) {
        return exit.call(process, (c || code || 1));
      }
      else {
        return exit.call(process, (c || code || 0));
      }
    });
  }
  else {
    return exit.call(process, code);
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
