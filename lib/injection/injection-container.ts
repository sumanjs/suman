'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import util = require('util');

//npm
const pragmatik = require('pragmatik');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const rules = require('../helpers/handle-varargs');

/*///////////////////// what it do //////////////////////////////////////

 this module is responsible for +++synchronously+++ injecting values;
 => values may be procured +asynchronously+ prior to this, but here we
 finish creating the entire arguments array, all synchronously

 //////////////////////////////////////////////////////////////////*/

export const makeInjectionContainer = function (suman: ISuman) {

  const getProxy = function (val: Object, props: Array<string>): any {

    return new Proxy(val, {
      get: function (target, prop) {

        let hasSkip = false;
        let newProps = props.concat(String(prop)).filter(function (v, i, a) {
          if (String(v) === 'skip') {
            hasSkip = true;
          }
          // we use this filter to get a unique list
          return a.indexOf(v) === i;
        });

        let method = String(newProps.shift()).toLowerCase();
        newProps = newProps.sort();
        newProps.unshift(method);

        if (hasSkip) {
          newProps = [method, 'skip'];
        }

        newProps = newProps.map(v => String(v).toLowerCase());

        let cache, cacheId = newProps.join('-');

        if (cache = suman.testBlockMethodCache[cacheId]) {
          return cache;
        }

        let fn = function () {

          let rule;

          if (method === 'describe' || method === 'context') {
            rule = rules.blockSignature;
          }
          else if (method === 'it' || method === 'test') {
            rule = rules.testCaseSignature;
          }
          else {
            rule = rules.hookSignature;
          }

          let args = pragmatik.parse(arguments, rule);

          // get rid of the first method argument
          newProps.slice(1).forEach(function (p) {
            args[1][p] = true;
          });

          args[1].__preParsed = true;

          try {
            let getter = `get_${method}`;
            return suman.ctx[getter]().apply(suman.ctx, args);
          }
          catch (err) {
            throw new Error(`property '${method}' is not available on test suite object.\n` + err.stack);
          }

        };

        return suman.testBlockMethodCache[cacheId] = getProxy(fn, newProps);
      }
    });
  };

  // being explicit here, container can dynamically find/discover props and subprops
  const container = {};
  return getProxy(container, []);

};
