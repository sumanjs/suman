'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const fnArgs = require('function-arguments');
const su = require('suman-utils');

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

  depList.forEach(d => {
    obj[d] = depContainerObj[d]; //copy only the subset
    if (!obj[d]) {
      throw new Error(' => Suman fatal error => no integrant with name = "' + d +
        '" was found in your suman.once.js file.');
    }

    if (typeof obj[d] !== 'function') {
      throw new Error(' => Suman fatal error => integrant entity with name = "' + d +
        '" was not found to be a function => ' + util.inspect(obj[d]));
    }
  });

  const temp = Object.keys(obj).map(function (key) {

    const fn = obj[key];

    return new Promise(function (resolve, reject) {

      if (_suman.sumanOpts.verbose || su.isSumanDebug()) {
        console.log(' => Executing dep with key = "' + key + '"');
      }

      setTimeout(function () {
        reject(new Error('Suman dependency acquisition timed-out for dependency with key/id="' + key + '"'));
      }, _suman.weAreDebugging ? 5000000 : 50000);

      if (typeof fn !== 'function') {
        reject({
          key: key,
          error: new Error(' => Suman usage error => would-be function was undefined or otherwise ' +
            'not a function => ' + String(fn))
        });
      }
      else if (fn.length > 0 && su.isGeneratorFn(fn)) {
        reject(new Error(' => Suman usage error => function was a generator function but also took a callback' + String(fn)));
      }
      else if (su.isGeneratorFn(fn)) {
        const gen = makeGen(fn, null);
        gen.call(null).then(resolve, function (e) {
          reject({
            key: key,
            error: e
          });
        });
      }
      else if (fn.length > 0) {
        let args = fnArgs(fn);
        let str = fn.toString();
        let matches = str.match(new RegExp(args[0], 'g')) || [];
        if (matches.length < 2) {
          //there should be at least two instances of the 'cb' string in the function,
          // one in the parameters array, the other in the fn body.
          return reject({
            key: key,
            error: new Error(' => Suman usage error => Callback in your function was not present => ' + str)
          });
        }
        fn.call(null, function (e, val) { //TODO what to use for ctx of this .apply call?
          e ? reject({
            key: key,
            error: e
          }) : resolve(val);
        });
      }
      else {
        Promise.resolve(fn.call(null)).then(resolve, function (e) {
          reject({
            key: key,
            error: e
          });
        });
      }

    });

  });

  Promise.all(temp).then(function (deps) {

    Object.keys(obj).forEach(function (key, index) {
      obj[key] = deps[index];
      su.runAssertionToCheckForSerialization(obj[key]);
    });

    cb(null, obj);

  }, function (err) {

    err = new Error(' => Suman fatal error => Suman had a problem verifying your integrants in ' +
      'your suman.once.js file for key => "' + err.key + '". => \n' + (err.stack || err.error || err));
    cb(err, {});

  });
};
