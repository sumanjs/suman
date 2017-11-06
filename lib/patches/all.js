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

Object.values = Object.values || function (v) {
  return Object.keys(v).map(function (k) {
    return v[k];
  });
};

const then = Promise.prototype.then;
Promise.prototype.then = function (fn1, fn2) {

  if (process.domain) {
    // this.domain = process.domain;
    fn1 = fn1 && process.domain.bind(fn1);
    fn2 = fn2 && process.domain.bind(fn2);
  }

  return then.call(this, fn1, fn2);
};

const katch = Promise.prototype.catch;
Promise.prototype.catch = function (fn1) {
  if (process.domain) {
    // this.domain = process.domain;
    fn1 = fn1 && process.domain.bind(fn1);
  }
  return katch.call(this, fn1);
};

// add a MF utility method to Number.prototype and String.prototype
String.prototype.times = Number.prototype.times = function (cb) {
  if (typeof cb !== 'function') {
    throw new TypeError('Callback is not a function');
  }
  else if (isNaN(parseInt(Number(this.valueOf())))) {
    throw new TypeError('Object/value is not a valid number');
  }
  for (let i = 0; i < Number(this.valueOf()); i++) {
    cb(i);
  }
};

/////// monkey patch process#exit FTMFW

// const exit = process.exit;
// let callable = true;

// process.exit = function (code, fn) {
//
//   console.error(new Error('exxxxx').stack);
//
//   if (!callable) {
//     if (fn === true) {
//       _suman.logError(`Suman implementation warning => we had to force exit with code ${code}.`);
//       return exit.call(process, code);
//     }
//     else {
//       _suman.logError('Suman implementation warning => process.exit() already called.');
//       return;
//     }
//   }
//
//   callable = false;
//
//   if (fn) {
//
//     if (typeof fn !== 'function') {
//       throw new Error('Suman internal implementation error => Please report ASAP, thanks.');
//     }
//
//     let to = setTimeout(function () {
//       _suman.logError('Shutdown function timed out.');
//       exit.call(process, (code || 1));
//     }, 100);
//
//     let final = function (err, c) {
//       clearTimeout(to);
//       if (err) {
//         exit.call(process, (c || code || 1));
//       }
//       else {
//         exit.call(process, (c || code || 0));
//       }
//     };
//
//     let isFinalCallable = true;
//     fn(function () {
//       if (!isFinalCallable) {
//         _suman.logError('Suman implementation warning => process.exit() already called.');
//         return;
//       }
//       isFinalCallable = false;
//       final.apply(null, arguments);
//     });
//   }
//   else {
//     return exit.call(process, code);
//   }
// };

/////////////////////////////////////////////

Function.prototype.adhere = function () {

  let self = this;
  let args1 = Array.from(arguments);

  return function () {

    let args2 = Array.from(arguments);
    return self.apply(this, args1.concat(args2));
  }

};

// const cp = require('child_process');
// const Mod = require('module');
// const req = Mod.prototype.require;
// Mod.prototype.require = function (d) {
//
//   try {
//     console.log('requiring this dependency:', d);
//     return req.apply(this, arguments);
//   }
//   catch (e) {
//     if (/^[A-Za-z]/.test(String(d))) {
//       console.error(`could not require dependency "${d}".`);
//       try {
//         var actualDep = String(d).split('/')[0];
//         console.error(`but we are resilient and we are attempting to install "${actualDep}" now.`);
//         cp.execSync(`cd ${_suman.projectRoot} && npm install ${actualDep}`);
//         return req.apply(this, arguments);
//       }
//       catch (err) {
//         console.error('\n', err.stack || err, '\n');
//         throw e;
//       }
//
//     }
//     else {
//       throw e;
//     }
//   }
//
// };

/////////////////////////////////////////////////////

// Array.prototype.mapToObject = function (fn) {
//
//   let obj = {};
//
//   for (let i = 0; i < this.length; i++) {
//
//     let ret;
//
//     if (fn) {
//       ret = fn.call(this, this[i], i);
//     }
//     else {
//       ret = this[i];
//     }
//
//     let keys = Object.keys(ret);
//     assert(keys.length, ' => Object needs keys.');
//
//     for (let j = 0; j < keys.length; j++) {
//       const k = keys[j];
//       obj[k] = ret[k];
//     }
//
//   }
//
//   return obj;
//
// };
