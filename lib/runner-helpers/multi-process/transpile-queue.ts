'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IGanttData} from "../socket-cp-hash";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import async = require('async');
import chalk = require('chalk');


//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////////

export const makeTranspileQueue = function (failedTransformObjects, outer, queuedTestFns) {

  const {sumanOpts, sumanConfig, projectRoot} = _suman;
  const waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;


  return async.queue(function (task: Function, cb: Function) {

    task(function (err: Error, file: string, shortFile: string, stdout: string, stderr: string, gd: IGanttData) {

      if (err) {
        _suman.logError('tranpile error => ', err.stack || err);
        failedTransformObjects.push({err, file, shortFile, stdout, stderr});
        return;
      }

      setImmediate(function () {

        console.log(chalk.red('pushing file '), file);

        if (waitForAllTranformsToFinish) {
          queuedTestFns.push(function () {
            outer(file, shortFile, stdout, gd);
          });
        }
        else {
          outer(file, shortFile, stdout, gd);
        }

        cb(null);

      });

    });

  }, 3);

};
