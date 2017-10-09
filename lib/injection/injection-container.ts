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

const possibleProps = <any> {

  // ALL LOWERCASE HERE

  //methods
  describe: true,
  beforeeach: true,
  aftereach: true,
  beforeall: true,
  afterall: true,
  after: true,
  before: true,
  context: true,
  it: true,
  test: true,
  setuptest: true,
  teardowntest: true,
  setup: true,
  teardown: true,

  // options
  events: true,
  errorevents: true,
  successevents: true,
  skip: true,
  fatal: true,
  parallel: true,
  series: true,
  cb: true,
  only: true,
  plan: true,
  throws: true,
  timeout: true,
  always: true,
  last: true,
  __preparsed: true

};

export const makeInjectionContainer = function (suman: ISuman) {

  const getProxy = function (val: Object, props: Array<string>): any {

    return new Proxy(val, {
      get: function (target, prop) {

        if (typeof prop === 'symbol') {
          return Reflect.get(...arguments);
        }

        let meth = String(prop).toLowerCase();

        if (!possibleProps[meth] /*&& !(prop in target)*/) {
          try {
            return Reflect.get(...arguments);
          }
          catch (err) {
            throw new Error(`Test suite may not have a '${prop}' property or method.\n${err.stack}`)
          }
        }

        let hasSkip = false;
        let newProps = props.concat(String(prop))
        .map(v => String(v).toLowerCase()) // we map to lowercase first, so we can use indexOf afterwards
        .filter(function (v, i, a) {
          if (v === 'skip') {
            hasSkip = true;
          }
          return a.indexOf(v) === i;  // we use this filter to get a unique list
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

          let getter = `get_${method}`;
          let meth = suman.ctx[getter];

          if (!meth) {
            throw new Error(`property '${method}' is not available on test suite object.`)
          }

          return meth().apply(suman.ctx, args);
        };

        return suman.testBlockMethodCache[cacheId] = getProxy(fn, newProps);
      }
    });
  };

  // being explicit here, container can dynamically find/discover props and subprops
  const container = {};
  return getProxy(container, []);

};
