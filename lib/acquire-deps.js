'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const fnArgs = require('function-arguments');
const sumanUtils = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
const makeGen = require('./helpers/async-gen');

////////////////////////////////////////////////////////////////////

// This module is used to require once-pre-integrants when running test in separate proc
// Since no integrants have already been cached (since we are single proc), we can simplify.
// Although we should just use the cache code instead

///////////////////////////////////////////////////////////////////

module.exports = function acquireDependencies(depList, depContainerObj, cb) {

  const obj = {};

  depList.forEach(dep => {
    obj[dep] = depContainerObj[dep]; //copy only the subset
    if (!obj[dep]) {
      throw new Error(' => Suman fatal error => no integrant with name = "' + dep +
        '" was found in your suman.once.js file.');
    }

    if (typeof obj[dep] !== 'function') {
      throw new Error(' => Suman fatal error => integrant entity with name = "' + dep +
        '" was not found to be a function => ' + util.inspect(obj[dep]));
    }
  });

  const temp = Object.keys(obj).map(function (key) {

    const fn = obj[key];

    return new Promise(function (resolve, reject) {

      if (_suman.sumanOpts.verbose || sumanUtils.isSumanDebug()) {
        console.log(' => Executing dep with key = "' + key + '"');
      }

      setTimeout(function () {
        reject(new Error('Suman dependency acquisition timed-out for dependency with key/id="' + key + '"'));
      }, _suman.weAreDebugging ? 5000000 : 50000);

      if (typeof fn !== 'function') {
        reject(new Error(' => Suman usage error => would-be function was undefined or otherwise ' +
          'not a function => ' + String(fn)));
      }
      else if (fn.length > 0 && sumanUtils.isGeneratorFn(fn)) {
        reject(new Error(' => Suman usage error => function was a generator function but also took a callback' + String(fn)));
      }
      else if (sumanUtils.isGeneratorFn(fn)) {
        const gen = makeGen(fn, null);
        gen.call(null).then(resolve, reject);
      }
      else if (fn.length > 0) {
        let args = fnArgs(fn);
        let str = fn.toString();
        let matches = str.match(new RegExp(args[0], 'g')) || [];
        if (matches.length < 2) { //there should be at least two instances of the 'cb' string in the function, one in the parameters array, the other in the fn body.
          throw new Error(' => Suman usage error => Callback in your function was not present => ' + str);
        }
        fn.call(null, function (err, val) { //TODO what to use for ctx of this .apply call?
          err ? reject(err) : resolve(val);
        });
      }
      else {
        Promise.resolve(fn.call(null)).then(resolve, reject);
      }

    });

  });

  Promise.all(temp).then(function (deps) {

    Object.keys(obj).forEach(function (key, index) {
      obj[key] = deps[index];
      sumanUtils.runAssertionToCheckForSerialization(obj[key]);
    });

    cb(null, obj);

  }, function (err) {

    err = new Error(' => Suman fatal error => Suman had a problem verifying your integrants in ' +
      'your suman.once.js file. => \n' + (err.stack || err));
    cb(err, {});

  });
};
