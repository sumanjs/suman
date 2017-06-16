'use strict';

import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');

// npm
const async = require('async');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');

let queue: any, envTotal: number, envConfig: number;

if (process.env.DEFAULT_PARALLEL_TOTAL_LIMIT && (envTotal = Number(process.env.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
  assert(Number.isInteger(envTotal), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
}

export const getQueue = function () {

  if (!queue) {
    // note: we have to create the queue after loading this file, so that _suman.sumanConfig is defined.

    if (_suman.sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT &&
      (envConfig = _suman.sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT)) {
      assert(Number.isInteger(envConfig), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
    }

    let concurrency = envTotal || envConfig || constants.DEFAULT_PARALLEL_TOTAL_LIMIT;

    queue = async.queue(function (task: Function, callback: Function) {
      task(callback);
    }, concurrency);

    // queue.drain = function () {
    //   console.log('all items have been processed in queue');
    // };

  }

  return queue;

};


let $exports = module.exports;
export default $exports;
