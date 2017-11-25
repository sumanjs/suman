'use strict';

//dts
import {IGlobalSumanObj, ISumanOpts} from "suman-types/dts/global";
import {IGanttData} from "../socket-cp-hash";
import {IRunnerRunFn, ISumanChildProcess} from "suman-types/dts/runner";
import {AsyncQueue} from "async";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');
import cp = require('child_process');
import fs = require('fs');
import EE = require('events');

//npm
import async = require('async');
import chalk = require('chalk');
import semver = require('semver');
import su = require('suman-utils');
import {events} from 'suman-events';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeHandleDifferentExecutables = function (projectRoot: string, sumanOpts: ISumanOpts) {

  return {

    handleRunDotShFile: function (sh: string, argz: Array<string>, cpOptions: Object, cb: Function) {

      _suman.log.info(chalk.bgWhite.underline('Suman has found a @run.sh file => '), chalk.bold(sh));

      //force to project root
      cpOptions.cwd = projectRoot;

      fs.chmod(sh, 0o777, function (err) {

        if (err) {
          return cb(err);
        }

        if (sumanOpts.coverage) {
          //TODO: we can pass an env to tell suman where to put the coverage data
          _suman.log.warning(chalk.yellow('coverage option was set to true, but we are running your tests via @run.sh.'));
          _suman.log.warning(chalk.yellow('so in this case, you will need to run your coverage call via @run.sh.'));
        }

        const n = cp.spawn(sh, argz, cpOptions) as ISumanChildProcess;

        cb(null, n);

      });

    }

  }

};


