'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
import async = require('async');
import chalk from 'chalk';
const uniq = require('lodash.uniq');
import * as _ from 'lodash';
const {events} = require('suman-events');
import * as fnArgs from 'function-arguments';
import * as su from 'suman-utils';
import {IRunnerObj} from "suman-types/dts/runner";
import {IIntegrantHash, IOncePost, TOncePostKeys} from "./runner";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import {makePostInjector} from '../injection/make-post-injector';
import {acquirePostDeps} from '../acquire-dependencies/acquire-post-deps';

const userData = {'chuck': 'chuck robbins'};

//////////////////////////////////////////////////////////////////////////////////////

export const makeBeforeExit = function (runnerObj: IRunnerObj, oncePosts: IOncePost, allOncePostKeys: TOncePostKeys) {

  return function beforeExitRunOncePost(cb: Function) {

    if (!runnerObj.hasOncePostFile) {
      return process.nextTick(cb);
    }

    const flattenedAllOncePostKeys = su.flattenDeep(allOncePostKeys).filter(function (v, i, a) {
      // create unique array
      return a.indexOf(v) === i;
    });

    const args = fnArgs(runnerObj.oncePostModule);
    const postInjector = makePostInjector(userData, null, null);
    const oncePostModuleRet = runnerObj.oncePostModule.apply(null, postInjector(args));

    assert(su.isObject(oncePostModuleRet), 'suman.once.post.js must return an object from the exported function.');
    const dependencies = oncePostModuleRet.dependencies;
    assert(su.isObject(dependencies),
      'the object returned from the exported function in suman.once.post.js must have a "dependencies" property.');

    flattenedAllOncePostKeys.forEach(function (k: string) {
      //we store an integer for analysis/program verification, but only really need to store a boolean
      //for existing keys we increment by one, otherwise assign to 1

      if (!(k in dependencies)) {
        console.error('\n');
        _suman.log.error(chalk.red('Suman usage error => your suman.once.post.js file ' +
          'is missing desired key ="' + k + '"'));
        return;
      }

      // copy only the relevant selection

      if (!su.isArrayOrFunction(dependencies[k])) {

        console.error('\n');
        _suman.log.error(chalk.red('Suman usage error => your suman.once.post.js file ' +
          'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"'));
      }
    });

    // we use the keys from oncePosts, because we don't
    // throw an error if oncePosts object does not have all the keys that are desired
    // it's better to try to shutdown as gracefully as possible at this point
    // instead of throwing an unnecessary error here
    const keys = Object.keys(oncePosts);

    if (keys.length) {
      console.log('\n');
      _suman.log.info(chalk.gray.bold('Suman is now running the desired hooks in suman.once.post.js, which include =>') +
        '\n\t', chalk.cyan(util.inspect(keys)));
    }

    acquirePostDeps(keys, dependencies).then(function () {
      console.log('\n');
      _suman.log.info('all suman.once.post.js hooks completed successfully.\n\n');
      process.nextTick(cb);

    }, function (err) {
      _suman.log.error(err.stack || err);
      process.nextTick(cb, err);
    });

  }
};
