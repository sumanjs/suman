'use strict';
import {IInjectionDeps} from "../../dts/injection";
import {IPseudoError} from "../../dts/global";
import {ITestSuite} from "../../dts/test-suite";

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
import * as chalk from 'chalk';
import su from 'suman-utils';

const includes = require('lodash.includes');
const fnArgs = require('function-arguments');

//project
const _suman = global.__suman = (global.__suman || {});
import {constants} from '../../config/suman-constants';
import {ISuman} from "../../dts/suman";
import makeIocDepInjections from '../injection/ioc-injector';
import {loadSumanConfig} from '../helpers/load-suman-config';
import {resolveSharedDirs} from '../helpers/resolve-shared-dirs';
import {loadSharedObjects} from '../helpers/load-shared-objects'
const IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';

/////////////////////////////////////////////////////////////

interface IIocPromiseContainer {
  [key: string]: Promise<any>;
}

interface IDependenciesObject {
  [key: string]: Function;
}

/////////////////////////////////////////////////////////////

const thisVal =
  {'message': 'A message to you, Suman User! dont use "this" here, instead => http://sumanjs.org/patterns.'};

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const acquireIocDeps = function (suman: ISuman, deps: Array<string>, suite: ITestSuite, cb: Function) {

  const iocPromiseContainer: IIocPromiseContainer = {};
  const sumanPaths = resolveSharedDirs(_suman.sumanConfig, _suman.projectRoot, _suman.sumanOpts);
  const {iocFn} = loadSharedObjects(sumanPaths, _suman.projectRoot, _suman.sumanOpts);
  let dependencies : IDependenciesObject = null;

  try {
    let iocFnArgs = fnArgs(iocFn);
    let getiocFnDeps = makeIocDepInjections(suman.iocData, null, null);
    let iocFnDeps = getiocFnDeps(iocFnArgs);
    let iocRet = iocFn.apply(null, iocFnDeps);
    assert(su.isObject(iocRet.dependencies),
      ' => suman.ioc.js must export a function which returns an object with a dependencies property.');
    dependencies = iocRet.dependencies;
  }
  catch (err) {
    _suman.logError(err.stack || err);
    _suman.logError('despite the error, suman will continue optimistically.');
    dependencies = {};
  }

  const obj: IInjectionDeps = {};

  deps.forEach(dep => {

    if (includes(constants.SUMAN_HARD_LIST, dep && String(dep)) && String(dep) in dependencies) {
      console.log('Warning: you added a IoC dependency for "' + dep +
        '" but this is a reserved internal Suman dependency injection value.');
      throw new Error('Warning: you added a IoC dependency for "' + dep +
        '" but this is a reserved internal Suman dependency injection value.');
    }

    if (!suite.parent) {

      if (dep in dependencies) {
        obj[dep] = dependencies[dep]; //copy subset of iocConfig to test suite

        if (!obj[dep] && !includes(constants.CORE_MODULE_LIST, String(dep)) &&
          !includes(constants.SUMAN_HARD_LIST, String(dep))) {

          let deps = Object.keys(dependencies || {}).map(function (item) {
            return ' "' + item + '" ';
          });

          _suman._writeTestError(new Error('The following desired dependency is not in your suman.ioc.js file: "' + dep + '"\n' +
            ' => ...your available dependencies are: [' + deps + ']').stack);
        }
      }
      else {

        // this dep name is not in the iocConfiguration
        obj[dep] = '[suman reserved - no ioc match]';
      }
    }
    else {
      obj[dep] = undefined;
    }
  });

  if (suite.parent) {
    // only the root suite can receive IoC injected deps
    // non-root suites can get injected deps via inject
    assert(!suite.isRootSuite, 'Suman implementation error => we expect a non-root suite here. Please report.');
    return process.nextTick(cb, null, obj);
  }

  const promises = Object.keys(obj).map(function (key) {

    if (iocPromiseContainer[key]) {
      return iocPromiseContainer[key];
    }

    return iocPromiseContainer[key] = new Promise(function (resolve, reject) {

      const fn = obj[key];

      if (fn === '[suman reserved - no ioc match]') {
        // most likely a core dep (assert, http, etc)
        obj[key] = undefined;
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

        fn.call(thisVal, function (err: IPseudoError, val: any) {
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
      //want to exit out of current tick for purposes of domains
      process.domain && process.domain.exit();
      process.nextTick(cb, null, obj);
    },
    function (err) {
      _suman.logError('Error acquiring ioc dependency:', err.stack || err);
      //want to exit out of current tick for purposes of domains
      process.domain && process.domain.exit();
      process.nextTick(cb, err, {});
    });
};
