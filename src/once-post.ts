'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');
import util = require('util');
import assert = require('assert');

//npm
import chalk from 'chalk';
import su = require('suman-utils');
const fnArgs = require('function-arguments');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {makePostInjector} from './injection/make-post-injector';
import {acquirePostDeps} from './acquire-dependencies/acquire-post-deps';

////////////////////////////////////////////////////////////////////////////////

export interface IOncePostModuleRetDependencies {
  [key: string]: Function
}

export interface IOncePostModuleRet {
  dependencies: IOncePostModuleRetDependencies
}

///////////////////////////////////////////////////////////////////////////////

export const run = function (cb: Function) {

  let oncePostKeys = _suman.oncePostKeys || [] as Array<string>;
  let userDataObj = _suman.userData || {};

  try {
    assert(Array.isArray(oncePostKeys), ' => (1) Perhaps we exited before <oncePostKeys> was captured.');
  }
  catch (err) {
    _suman.log.error(su.decomposeError(err));
    return process.nextTick(cb, null, []);
  }

  oncePostKeys = su.flattenDeep(oncePostKeys).filter(function (v, i, a) {
    // create unique array
    return a.indexOf(v) === i;
  });

  try {
    assert(su.isObject(userDataObj), ' =>  (2) Perhaps we exited before <userDataObj> was captured.');
  }
  catch (err) {
    _suman.log.error(su.decomposeError(err));
    userDataObj = {};
  }

  let postInjector = makePostInjector(userDataObj, null, null);
  const first: Function = su.onceAsync(this, cb);

  let oncePostModuleRet: IOncePostModuleRet,
    dependencies: IOncePostModuleRetDependencies,
    hasonlyPostKeys = oncePostKeys.length > 0;

  if (!hasonlyPostKeys) {
    return first(null, []);
  }

  const postFn = _suman.integrantPostFn;

  try {
    let argNames = fnArgs(postFn);
    let argValues = postInjector(argNames);
    oncePostModuleRet = postFn.apply(null, argValues);
  }
  catch (err) {
    _suman.log.error('Your <suman.once.post.js> file must export a function that returns an object with a "dependencies" property.');
    _suman.log.error(err.stack);
    return first(null, []);
  }

  if (!su.isObject(oncePostModuleRet)) {
    _suman.log.error('Your <suman.once.post.js> file must export a function that returns an object.');
    return first(null, []);
  }

  dependencies = oncePostModuleRet.dependencies || oncePostModuleRet.deps;

  if (!su.isObject(dependencies)) {
    _suman.log.error('Your <suman.once.post.js> file must export a function that returns an object, ' +
      'with a property named "dependencies".');
    return first(null, []);
  }

  const missingKeys: Array<string> = [];

  oncePostKeys.forEach(function (k: string) {
    //we store an integer for analysis/program verification, but only really need to store a boolean
    //for existing keys we increment by one, otherwise assign to 1

    if (!(k in dependencies)) {
      missingKeys.push(k);
      console.error('\n');
      _suman.log.error(chalk.red('Suman usage error => your suman.once.post.js file ' +
        `is missing desired key = "${k}"`));
      return;
    }

    if (!su.isArrayOrFunction(dependencies[k])) {

      _suman.log.error('Suman is about to conk out => ');
      _suman.log.error(' => here is the contents return by the exported function in suman.once.post.js =>');
      console.log('\n');
      console.log(util.inspect(dependencies));
      console.log('\n');
      throw new Error(chalk.red('Suman usage warning => your suman.once.post.js ' +
        'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"'));
    }
  });

  if (oncePostKeys.length > 0) {
    _suman.log.info('Suman is now running the desired hooks ' +
      'in suman.once.post.js, listed as follows =>');
    oncePostKeys.forEach(function (k, index) {
      _suman.log.info(`(${index + 1})`, `"${chalk.cyan(k)}"`);
    });
    console.log('\n');
  }

  if (missingKeys.length > 0) {
    _suman.log.error(`Your suman.once.post.js file is missing some keys present in your test file(s).`);
    _suman.log.error(`The missing keys are as follows: ${chalk.magenta(util.inspect(missingKeys))}`);
    console.log('\n');
  }

  acquirePostDeps(oncePostKeys, dependencies).then(function (val) {
      console.log('\n');
      _suman.log.info('All <suman.once.post.js> hooks completed successfully.');
      _suman.log.info('Results value from <suman.once.post.js>:');
      _suman.log.info(util.inspect(val));
      process.nextTick(cb);
    },
    function (err) {
      _suman.log.error(err.stack || err);
      process.nextTick(cb, err);
    });

};




