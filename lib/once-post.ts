'use strict';
import {IGlobalSumanObj} from "../dts/global";
import {ISumanErrorFirstCB} from "./index";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as path from 'path';
import * as util from 'util';
import * as assert from 'assert';

//npm
import * as async from 'async';
import * as chalk from 'chalk';
import su from 'suman-utils';
import * as _ from 'lodash';
const fnArgs = require('function-arguments');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const callbackOrPromise = require('./callback-or-promise');
import {makePostInjector} from './injection/make-post-injector';

////////////////////////////////////////////////////////////////////////////////

export interface IOncePostModuleRetDependencies {
  [key: string]: Function
}

export interface IOncePostModuleRet {
  dependencies: IOncePostModuleRetDependencies
}

///////////////////////////////////////////////////////////////////////////////

export const run = function ($oncePostKeys: Array<string>, userDataObj, cb: ISumanErrorFirstCB) {

  try {
    assert(Array.isArray($oncePostKeys), ' => (1) Perhaps we exited before <oncePostKeys> was captured.');
  }
  catch (err) {
    _suman.logError('\n', su.decomposeError(err), '\n\n');
  }

  const oncePostKeys = _.flattenDeep($oncePostKeys);

  try {
    assert(su.isObject(userDataObj), ' =>  (2) Perhaps we exited before <userDataObj> was captured.');
  }
  catch (err) {
    _suman.logError('\n => Suman internal message => ', su.decomposeError(err), '\n\n');
    userDataObj = {};
  }

  let postInjector = makePostInjector(userDataObj, null);

  const first: ISumanErrorFirstCB = su.onceAsync(this, cb);

  let oncePostModule: Function,
    oncePostModuleRet: IOncePostModuleRet,
    dependencies: IOncePostModuleRetDependencies,
    oncePosts = {} as Partial<IOncePostModuleRetDependencies>,
    hasonlyPostKeys = oncePostKeys.length > 0;

  if (!hasonlyPostKeys) {
    return first(null, []);
  }

  try {
    oncePostModule = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.once.post.js'));
  }
  catch (err) {
    console.error('\n', ' => Suman usage warning => you have suman.once.post defined, but no suman.once.post.js file.');
    console.error(err.stack || err);
    return first(err, []);
  }

  try {
    assert(typeof  oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
  }
  catch (err) {
    console.log(' => Your suman.once.post.js file must export a function that returns an object.');
    console.error(err.stack || err);
    return first(null, []);
  }

  try {
    let argNames = fnArgs(oncePostModule);
    let argValues = postInjector(argNames);
    oncePostModuleRet = oncePostModule.apply(null, argValues);
  }
  catch (err) {
    console.log(' => Your suman.once.post.js file must export a function that returns an object.');
    console.error(err.stack || err);
    return first(null, []);
  }

  if (!su.isObject(oncePostModuleRet)) {
    _suman.logError('Your suman.once.post.js file must export a function that returns an object.');
    return first(null, []);
  }

  dependencies = oncePostModuleRet.dependencies;

  if (!su.isObject(dependencies)) {
    _suman.logError('Your suman.once.post.js file must export a function that returns an object, ' +
      'with a property named "dependencies".');
    return first(null, []);
  }

  oncePostKeys.forEach(function (k: string) {
    //we store an integer for analysis/program verification, but only really need to store a boolean
    //for existing keys we increment by one, otherwise assign to 1

    if (!(k in dependencies)) {
      console.error('\n');
      _suman.logError(colors.red('Suman usage error => your suman.once.post.js file ' +
        'is missing desired key ="' + k + '"'));
      return;
    }

    const o = oncePosts[k] = dependencies[k];

    if (!su.isArrayOrFunction(o)) {

      console.error(' => Suman is about to conk out =>\n\n' +
        ' => here is the contents return by the exported function in suman.once.post.js =>\n\n', oncePosts);

      console.error('\n');
      throw new Error(chalk.red(' => Suman usage warning => your suman.once.post.js ' +
        'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"'));
    }
  });

  const keys = Object.keys(oncePosts);

  if (keys.length) {
    console.log('\n', ' => Suman message => Suman is now running the desired hooks ' +
      'in suman.once.post.js, which include => \n\t', chalk.cyan(util.inspect(keys)));
  }
  else {
    return first(new Error('Your suman.once.post.js file is missing some keys present ' +
      'in your test file(s).'), []);
  }

  async.mapSeries(keys, function (k: string, cb: Function) {

    callbackOrPromise(k, oncePosts, function (err: Error) {
      cb(null, err);
    });

  }, function (err: Error, results: Array<any>) {
    if (err) {
      console.error(err.stack || err);
      first(err, results);
    }
    else {
      console.log('\n\n', ' => Suman message => all suman.once.post.js hooks completed...exiting...');
      if (results.filter(i => i).length) {
        console.log('\n\n', ' => Suman message => it appears you have some errors ' +
          'experienced in the shutdown hooks and are logged below =>', '\n\n');
      }
      first(null, results);
    }

  });

};

const $exports = module.exports;
export default $exports;
