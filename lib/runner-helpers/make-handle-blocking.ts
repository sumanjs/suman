'use strict';
import {IHandleBlocking, IRunnerObj, IRunnerRunFn, ISumanChildProcess} from "../../dts/runner";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
import util = require('util');

//npm
import * as chalk from 'chalk';

const sortBy = require('lodash.sortby');
const includes = require('lodash.includes');
const flattenDeep = require('lodash.flattendeep');
const intersection = require('lodash.intersection');

//project
const _suman = global.__suman = (global.__suman || {});
const weAreDebugging = require('../helpers/we-are-debugging');
import su = require('suman-utils');

////////////////////////////////////////////////////////////////////////////////////////

const started: Array<IRunnerRunFn> = [];
const ended: Array<IRunnerRunFn> = [];

//////////////////////////////////////////////////////////////////////////////////////////

export default function (order: Object): IHandleBlocking {

  const config = _suman.sumanConfig;
  const maxProcs = _suman.maxProcs;

  let interval = 10000;
  let timeout = 1000;

  if (true || _suman.sumanOpts && _suman.sumanOpts.verbosity > 2) {
    setInterval(function () {
      setTimeout(function () {

        _suman.log('number of processes already started', started.length);
        _suman.log('number of processes already ended', ended.length);

        const startedButNotEnded = started.filter(function ($item) {
          return ended.every(function (item) {
            return (String(item.testPath) !== String($item.testPath));
          });
        }).map(function (item) {
          return '\n  ' + item.testPath;
        });

        if (startedButNotEnded.length > 0) {
          console.log('\n');
          _suman.log(chalk.bgCyan.black.bold('The following test processes have started but not ended yet:'));
          console.log(chalk.cyan(String(startedButNotEnded)));
          console.log('\n');
        }

      }, timeout += 8000);
    }, interval);
  }

  function findQueuedCPsToStart(queuedCPsObj: IRunnerObj): IRunnerRunFn {
    if (started.length - ended.length < maxProcs) {
      return queuedCPsObj.queuedCPs.pop();
    }
  }

  return {

    runNext: function (fn: IRunnerRunFn): boolean {
      if (started.length - ended.length < maxProcs) {
        started.push(fn);
        fn.call(null);
        return true;
      }
    },

    getStartedAndEnded: function () {
      return {
        started,
        ended
      }
    },

    determineInitialStarters: function (files: Array<string>) {
      throw new Error('no longer used.');
    },

    shouldFileBeBlockedAtStart: function (file: string) {
      throw new Error('no longer used.');
    },

    releaseNextTests: function releaseNextTests(testPath: string, queuedCPsObj: IRunnerObj) {

      const val = started.filter(function (item) {
        return String(item.testPath) === String(testPath);
      })[0];

      ended.push(val);

      const cpFn = findQueuedCPsToStart(queuedCPsObj);

      if (cpFn) {
        started.push(cpFn);
        _suman.log('Test path started and is now running => ', cpFn.testPath);
        cpFn.call(null);
      }

    }
  }
};
