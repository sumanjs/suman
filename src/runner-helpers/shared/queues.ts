'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IGanttData} from "../socket-cp-hash";
import {AsyncQueue} from 'async';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import async = require('async');
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////

let runQueue : AsyncQueue<Function> = null;

export const getRunQueue = function(){
  return runQueue;
};

export const makeRunQueue = function () {
  const {maxProcs} = _suman;
  return runQueue = async.queue((task,cb) => task(cb), maxProcs);
};


let transpileQueue : AsyncQueue<Function> = null;

export const getTranspileQueue = function(){
  return transpileQueue;
};

export const makeTranspileQueue = function (failedTransformObjects, runFile: Function, queuedTestFns) {

  const {sumanOpts, sumanConfig, projectRoot} = _suman;
  const waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;

  return transpileQueue = async.queue(function (task: Function, cb: Function) {

    task(function (err: Error, file: string, shortFile: string, stdout: string, stderr: string, gd: IGanttData) {

      if (err) {
        _suman.log.error('transform error => ', err.stack || err);
        failedTransformObjects.push({err, file, shortFile, stdout, stderr});
        return;
      }

      setImmediate(cb);

      if (waitForAllTranformsToFinish) {
        queuedTestFns.push(function () {
          runFile(file, shortFile, stdout, gd);
        });
      }
      else {
        runFile(file, shortFile, stdout, gd);
      }

    });

  }, 3);

};
