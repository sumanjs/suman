'use strict';

//dts
import {IInjectionObj, ITestSuite} from "suman-types/dts/test-suite";
import {IPseudoError, IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');

//npm
import async = require('async');
import {freezeExistingProps as freeze} from 'freeze-existing-props';
import su = require('suman-utils');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
import {tProto} from './t-proto';
import {constants} from "../../config/suman-constants";
const weAreDebugging = su.weAreDebugging;

///////////////////////////////////////////////////////////////////

interface IInjectionRetObj {
  [key: string]: any
}

///////////////////////////////////////////////////////////////////

export const handleInjections = function (suite: ITestSuite, cb: Function) {

  const addValuesToSuiteInjections = function (k: string, val: any) : void {
    if (k in suite.injectedValues) {
      throw new Error(` => Injection value '${k}' was used more than once; this value needs to be unique.`);
    }

    // freeze the property so it cannot be modified by user after the fact
    Object.defineProperty(suite.injectedValues, k, {
      enumerable: true,
      writable: false,
      configurable: true,
      value: val
    });
  };

  const isDescValid = function(desc: string){
    return desc && String(desc) !== String(constants.UNKNOWN_INJECT_HOOK_NAME)
  };

  const injections = suite.getInjections();

  async.each(injections, function (inj: IInjectionObj, cb: Function) {

    let callable = true;

    const to = setTimeout(function () {
      first(new Error(` => Injection hook timeout. ${inj.desc && 'For injection with name => ' + inj.desc}`));
    }, weAreDebugging ? 5000000 : inj.timeout);

    const first = function (err: IPseudoError) {
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

      let d = function (err: IPseudoError, results: IInjectionRetObj) {

        if (err) {
          return first(err);
        }

        Promise.resolve(results).then(ret => {

          if (isDescValid(inj.desc)) {
            addValuesToSuiteInjections(String(inj.desc), ret);
          }
          else {
            Object.keys(ret).forEach(function (k) {
              addValuesToSuiteInjections(String(k), freeze(ret[k]));
            });
          }

          first(undefined);

        }, first);
      };

      inj.fn.call(suite, Object.setPrototypeOf(d, tProto));
    }

    else {

      Promise.resolve(inj.fn.call(suite)).then(ret => {

        if (isDescValid(inj.desc)) {
          addValuesToSuiteInjections(inj.desc, freeze(ret));
          return first(undefined);
        }

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
            addValuesToSuiteInjections(String(k), freeze(vals[index]));
          });

          first(undefined);

        }, first);

      }, first);

    }

  }, cb);

};


