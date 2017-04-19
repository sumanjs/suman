'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const async = require('async');

//project
const _suman = global.__suman = (global.__suman || {});
const freeze = require('./freeze-existing');
const weAreDebugging = require('./helpers/we-are-debugging');

///////////////////////////////////////////////////////////////////

interface IInjectionRetObj {
  [key: string]: any
}


///////////////////////////////////////////////////////////////////


export = function (suite: ITestSuite, cb: Function) {

  function addValuesToSuiteInjections(k: string, val: any) {
    if (k in suite.injectedValues) {
      throw new Error(' => Injection value ' + k + ' was used more than once;' +
        ' this value needs to be unique.');
    }
    else {
      suite.injectedValues[k] = val;
    }
  }

  const injections = suite.getInjections();

  async.eachSeries(injections, function (inj: IInjectionObj, cb: Function) {

    let callable = true;

    const to = setTimeout(function () {
      first(new Error(' => Injection hook timeout.'));
    }, weAreDebugging ? 5000000 : inj.timeout);

    const first = function (err: IPsuedoError) {
      if (callable) {
        callable = false;
        clearTimeout(to);
        process.nextTick(cb, err);
      }
      else if (err) {
        console.error(' => Callback was called more than once, with error => \n', err.stack || err);
      }
    };

    if (inj.cb) {

      inj.fn.call(suite, function (err: IPsuedoError, results: IInjectionRetObj) {

        if (err) {
          return first(err);
        }

        let p = Promise.resolve(results);

        p.then(ret => {

          if (inj.desc) {
            addValuesToSuiteInjections(inj.desc, ret);
          }
          else {
            Object.keys(ret).forEach(function (k) {
              addValuesToSuiteInjections(k, freeze(ret[k]));
            });

          }

          first(undefined);

        }, first);

      });

    }

    else {

      let p = Promise.resolve(inj.fn.call(suite));

      p.then(ret => {

        if (inj.desc) {
          addValuesToSuiteInjections(inj.desc, freeze(ret));
          first(undefined);
        }
        else {

          if (typeof ret !== 'object') {
            throw new Error('Must return an object with keys, if no inject hook name is provided.');
          }

          if (Array.isArray(ret)) {
            throw new Error('Must return an object with named keys, if no inject hook name is provided.');
          }

          const keys = Object.keys(ret);

          if (!keys.length) {
            throw new Error('Injection hook was unnamed, but also resolved to object with no keys,\nso no name could' +
              'be extracted for injection. Unfortunately this becomes fatal.');
          }

          const potentialPromises = keys.map(function (k) {
            return ret[k];
          });

          Promise.all(potentialPromises).then(function (vals) {

            keys.forEach(function (k, index) {
              addValuesToSuiteInjections(k, freeze(vals[index]));
            });

            first(undefined);

          }, first);

        }

      }, first);

    }

  }, cb);

};
