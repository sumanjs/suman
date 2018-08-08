'use strict';

//dts
import {IInjectionDeps} from "suman-types/dts/injection";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
import chalk from 'chalk';
import su = require('suman-utils');
const includes = require('lodash.includes');
const fnArgs = require('function-arguments');

//project
const _suman = global.__suman = (global.__suman || {});
import {constants} from '../config/suman-constants';
import {ISuman, Suman} from "../suman";
import {makeIocInjector} from '../injection/ioc-injector';
import {loadSumanConfig, resolveSharedDirs, loadSharedObjects} from '../helpers/general';
import {TestBlock} from "../test-suite-helpers/test-suite";
import {EVCb} from "suman-types/dts/general";

const IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';

/////////////////////////////////////////////////////////////

interface IIocPromiseContainer {
  [key: string]: Promise<any>;
}

interface IDependenciesObject {
  [key: string]: Function;
}

////////////////////////////////////////////////////////////////////////////////////////////////////

const noKeyExistsPlaceholder = '[suman reserved - no ioc match]';
const thisVal = {'message': `Suman users: don't use "this" here, instead => http://sumanjs.org/patterns.`};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const acquireIocDeps = (suman: ISuman, iocDepNames: Array<string>, suite: TestBlock, obj: IInjectionDeps, cb: EVCb<any>) => {
  

    const iocPromiseContainer = suman.iocPromiseContainer;
    let dependencies: IDependenciesObject = null;

    try {
      let sumanPaths = resolveSharedDirs(_suman.sumanConfig, _suman.projectRoot, _suman.sumanOpts);
      let {iocFn} = loadSharedObjects(sumanPaths, _suman.projectRoot, _suman.sumanOpts);
      let iocFnArgs = fnArgs(iocFn);
      let getiocFnDeps = makeIocInjector(suman.iocData, null, null);
      let iocFnDeps = getiocFnDeps(iocFnArgs);
      let iocRet = iocFn.apply(null, iocFnDeps);
      assert(su.isObject(iocRet.dependencies),
        ' => suman.ioc.js must export a function which returns an object with a dependencies property.');
      dependencies = iocRet.dependencies;
    }
    catch (err) {
      _suman.log.error(err.stack || err);
      _suman.log.error('despite the error, suman will continue optimistically.');
      dependencies = {};
    }

    iocDepNames.forEach(dep => {

      if (dep in dependencies) {
        let d = obj[dep] = dependencies[dep]; //copy subset of iocConfig to test suite

        if (!d) {

          let deps = Object.keys(dependencies || {}).map(function (item) {
            return ' "' + item + '" ';
          });

          _suman.writeTestError(`Warning: the following desired dependency is not in your suman.ioc.js file => '${dep}'`);
          _suman.writeTestError(' => ...your available dependencies are: [' + deps + ']');
          obj[dep] = noKeyExistsPlaceholder;
        }
      }
      else {

        _suman.log.warning(`warning: the following dep is not in your suman.ioc.js configuration '${dep}'`);
        obj[dep] = noKeyExistsPlaceholder;
      }

    });

    const promises = Object.keys(obj).map(function (key) {

      if (iocPromiseContainer[key]) {
        return iocPromiseContainer[key];
      }

      return iocPromiseContainer[key] = new Promise(function (resolve, reject) {

        const fn = obj[key];

        if (fn === '[suman reserved - no ioc match]') {
          // this means that no key existed in suman.ioc.js
          resolve();
        }
        else if (typeof fn !== 'function') {
          reject(new Error('Value in IOC object was not a function for corresponding key => ' +
            '"' + key + '", value => "' + util.inspect(fn) + '"'));
        }
        else if (fn.length > 1) {
          reject(new Error(chalk.red(' => Suman usage error => suman.ioc.js functions take 0 or 1 arguments, ' +
            'with the single argument being a callback function.')));
        }
        else if (fn.length > 0) {
          let args = fnArgs(fn);
          let str = fn.toString();
          let matches = str.match(new RegExp(args[1], 'g')) || [];
          if (matches.length < 2) {
            //there should be at least two instances of the 'cb' string in the function,
            // one in the parameters array, the other in the fn body.
            throw new Error('Callback in your function was not present => ' + str);
          }

          fn.call(thisVal, function (err: any, val: any) {
            err ? reject(err) : resolve(val);
          });
        }
        else {
          Promise.resolve(fn.call(thisVal)).then(resolve, reject);
        }

      });

    });

    Promise.all(promises).then(function (deps) {

        Object.keys(obj).forEach(function (key, index) {
          obj[key] = deps[index];
        });

        try {
          process.domain && process.domain.exit();
        }
        finally {
          //want to exit out of current tick for purposes of domains
          process.nextTick(cb, null, obj);
        }

      },
      function (err) {
        _suman.log.error('Error acquiring ioc dependency:', err.stack || err);
        try {
          process.domain && process.domain.exit();
        }
        finally {
          //want to exit out of current tick for purposes of domains
          process.nextTick(cb, err, {});
        }

      });
  };
