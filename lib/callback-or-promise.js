'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const domain = require('domain');
const assert = require('assert');
const util = require('util');

//npm
const su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
const makeGen = require('./helpers/async-gen');

/////////////////////////////////////////////////////////////////

module.exports = function callbackOrPromise (key, hash, cb) {

  const d = domain.create();

  let called = false;

  function first () {
    if (!called) {
      called = true;
      d.exit();
      const args = Array.from(arguments);
      process.nextTick(function () {
        cb.apply(null, args);
      });
    }
    else {
      console.error.apply(console, arguments);
    }
  }

  d.once('error', function (err) {
    console.log(err.stack || err);
    first(err);
  });

  d.run(function () {
    process.nextTick(function () {
      const fn = hash[ key ];

      assert(typeof fn === 'function', 'Integrant listing is not a function => ' + key,
        '\n\n => instead we have => \n\n', util.inspect(fn));

      const isGeneratorFn = su.isGeneratorFn(fn);

      if (isGeneratorFn && fn.length > 0) {
        first(new Error(' => Suman usage error, you have requested a callback to a generator function => \n' + fn.toString()));
      }
      else if (isGeneratorFn) {
        const gen = makeGen(fn, null);
        gen.call(null).then(function (val) {
          first(null, val);
        }, first);
      }
      else if (fn.length > 0) {

        fn.call(null, function (err, val) {
          err ? first(err) : first(null, val);
        });

      }
      else {
        Promise.resolve(fn.call(null)).then(function (val) {
          //TODO: we could send val to indvidual tests, in the form of JSON
          first(null, val);

        }, first);
      }
    });
  });

};
