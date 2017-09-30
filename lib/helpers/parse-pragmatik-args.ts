'use strict';

//typesscript
import {IAllOpts} from "suman-types/dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import util = require('util');

//npm
const pragmatik = require('pragmatik');
import async = require('async');
import * as chalk from 'chalk';
import {IGlobalSumanObj} from "suman-types/dts/global";

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});

/*////// what it do ///////////////////////////////////////////////


 */////////////////////////////////////////////////////////////////

export const parseArgs =  function (args: Array<any>, fnIsRequired?: boolean) {

  let [desc, opts, arr, fn] = args;

  if (arr && fn) {
    //TODO: we should reference the clone error from each hook or test case
    throw new Error(' => Suman usage error. Please define either an array or callback.');
  }

  let arrayDeps: Array<IAllOpts>;

  if (arr) {
    //note: you can't stub a test block!
    if (typeof arr[arr.length - 1] === 'function') {
      fn = arr[arr.length - 1];
      arrayDeps = arr.slice(0, -1);
    }
    else{
      arrayDeps = arr.slice(0);
    }
  }

  if (fnIsRequired) {
    assert.equal(typeof fn, 'function', ' => Suman usage error => ' +
      'You need to pass a function as the last argument to the array.');
    // remove last element
  }

  desc = desc || (fn ? fn.name : '(suman unknown name)');

  //avoid unncessary pre-assignment
  arrayDeps = arrayDeps || [];

  return {
    arrayDeps,
    // we don't need to pass the array back
    args: [desc, opts, fn]
  }
};
