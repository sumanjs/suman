'use strict';

//dts
import {IGlobalSumanObj, ISumanOpts, ISumanConfig} from "suman-types/dts/global";
import {AsyncResultArrayCallback} from 'async';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import os = require('os');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
import * as async from 'async';

const shuffle = require('lodash.shuffle');
import chalk from 'chalk';
import * as su from 'suman-utils';

const rimraf = require('rimraf');
const {events} = require('suman-events');
const uuid = require('uuid/v4');
const mkdirp = require('mkdirp');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const sumanHome = path.resolve(process.env.HOME + '/.suman');
import {noFilesFoundError} from './helpers/no-files-found-error';
import {ascii} from './helpers/ascii';
import {constants} from './config/suman-constants';
import {findFilesToRun} from './runner-helpers/get-file-paths';
import {EVCb} from "suman-types/dts/general";

const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const dbPth = path.resolve(sumanHome + '/database/exec_db');

//////////////////////////////////////////////////////////////////////////////////////////////////

export interface Results {
  getFilesToRun: FilesToRun
}


export interface FilesToRun {
  files: Array<any>
}

export const run = function (sumanOpts: ISumanOpts, sumanConfig: ISumanConfig, paths: Array<string>) {

  const logsDir = sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
  const sumanCPLogs = path.resolve(logsDir + '/runs');
  const sumanMetaDir = path.resolve(_suman.sumanHelperDirRoot + '/.meta');

  debugger;  //leave here forever so users can easily debug

  let sql: any;
  let runId: number = _suman.runId = process.env.SUMAN_RUN_ID = null;
  const projectRoot = _suman.projectRoot;
  const timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP = Date.now();
  // const server = _suman.server = findSumanServer(null);
  const testDir = process.env.TEST_DIR;
  const testSrcDir = process.env.TEST_SRC_DIR;
  const testTargerDir = process.env.TEST_TARGET_DIR;
  const makeSumanLog = process.env.MAKE_SUMAN_LOG = 'yes';
  const IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';

  // this should get refactored into runner get-file-paths.js
  require('./helpers/general').vetPaths(paths);

  if (paths.length < 1) {
    if (testSrcDir) {
      _suman.log.warning('No test paths provided, defaulting to the "testSrcDir" property value in your <suman.conf.js> file.');
      paths = [testSrcDir];
    }
    else {
      _suman.log.warning('no "testSrcDir" property found in <suman.conf.js>, defaulting to "test" directory.');
      paths = [path.resolve(projectRoot + '/test')];
    }
  }

  if (su.vgt(4)) {
    _suman.log.info();
    _suman.log.info('Suman will attempt to load these test paths:');
    paths.forEach(function (p, i) {
      _suman.log.info(i + 1, p);
    });
  }

  async.autoInject({

      getChildEnvVars: function (cb: Function) {

        if (!sumanOpts.child_env) {
          return process.nextTick(cb);
        }

        return process.nextTick(cb);

      },

      mkdirs: function (cb: AsyncResultArrayCallback<Error, Iterable<any>>) {

        let makeFile = function (file: string) {
          return function (cb: Function) {
            mkdirp(file, cb);
          }
        };

        async.series([
          makeFile(path.resolve(sumanCPLogs)),
          makeFile(path.resolve(sumanMetaDir)),
          makeFile(path.resolve(sumanHome + '/global')),
          makeFile(path.resolve(sumanHome + '/database'))
        ], cb);
      },

      rimrafLogs: function (mkdirs: any, cb: EVCb<any>) {

        async.parallel({

          removeOutdated: function (cb: EVCb<any>) {

            fs.readdir(sumanCPLogs, function (err: Error, items) {

              if (err) {
                return cb(err);
              }

              // we only keep the most recent 5 items, everything else we delete
              items.sort().reverse().splice(0, Math.min(items.length, 4));

              async.each(items, function (item: string, cb: Function) {
                const pitem = path.resolve(sumanCPLogs + '/' + item);
                rimraf(pitem, cb); // ignore callback
              }, cb);

            });

          }

        }, cb);

      },

      checkIfTSCMultiWatchLock: function (cb: EVCb<any>) {

        //fs.exists is deprecated
        fs.stat(path.resolve(projectRoot + '/suman-watch.lock'), function (err) {
          if (!err) {
            _suman.multiWatchReady = true;
          }
          // don't pass error
          cb(null);
        });
      },

      getFilesToRun: function (cb: EVCb<FilesToRun>) {

        if (sumanOpts.browser) {

          try {
            require('suman-browser');
          }
          catch (err) {
            delete require.cache['suman-browser'];
            if (process.env.SUMAN_ENV === 'local') {
              _suman.log.warning('since we are in development, we are linking suman-browser with "npm link suman-browser".');
              cp.execSync('npm link suman-browser');
            }
            else {
              throw new Error('You need to install "suman-browser", using `npm install -D suman-browser`.');
            }
          }

          try {
            const browser = sumanConfig['browser']  as any;
            assert(su.isObject(browser), '"browser" property on suman.conf.js needs to be an object.');
            const entryPoints = browser['entryPoints'];
            assert(Array.isArray(entryPoints), '"entryPoints" property needs to be an Array instance.');
            const files = entryPoints.map(item => item.html);
            return process.nextTick(cb, null, {files});
          }
          catch (err) {
            return process.nextTick(cb, err);
          }
        }
        else {
          findFilesToRun(paths, cb);
        }

      },

      findSumanMarkers: function (getFilesToRun: FilesToRun, cb: EVCb<any>) {

        su.findSumanMarkers([
            '@run.sh',
            '@transform.sh',
            '@config.json'
          ],

          testDir,
          getFilesToRun.files,

          function (err: Error, map: any) {

            if (err) {
              return cb(err);
            }
            _suman.markersMap = map;
            cb(null);
          });
      },

      conductStaticAnalysisOfFilesForSafety: function (cb: Function) {
        if (false && sumanOpts.safe) {
          cb(new Error('safe option not yet implemented'));
        }
        else {
          process.nextTick(cb);
        }
      },

      getRunId: function (cb: Function) {

        runId = _suman.runId = process.env.SUMAN_RUN_ID = uuid();
        let p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
        mkdirp(p, 0o777, cb);

        // if we want to use sqlite3, then we import the sqlite code from lib/sqlite3
      }

    },

    function complete(err: Error, results: Results) {

      if (err) {
        console.error('\n');
        _suman.log.error('Fatal problem occurred:');
        _suman.log.error(err.stack || err);
        return process.exit(1);
      }

      if (su.vgt(9)) {
        //TODO: this is not ready yet
        _suman.log.info('"$ npm list -g" results: ', results.npmList);
      }

      const changeCWDToRootOrTestDir = function (p: string) {
        if (sumanOpts.cwd_is_root || true) {
          process.chdir(projectRoot);
        }
        else {
          process.chdir(path.dirname(p));  //force CWD to test file path!
        }
      };

      const obj = results.getFilesToRun;

      let files = obj.files;
      const nonJSFile = Boolean(obj.nonJSFile);

      if (files.length < 1) {
        return noFilesFoundError(paths);
      }

      rb.emit(String(events.RUNNER_TEST_PATHS_CONFIRMATION), files);

      if (su.vgt(6) || sumanOpts.dry_run) {
        console.log(' ', chalk.bgCyan.magenta(' => Suman verbose message => ' +
          'Suman will execute test files from the following locations:'), '\n', files, '\n');
      }

      if (sumanOpts.dry_run || sumanOpts.$dryRun) {
        _suman.log.info('exiting here, because "--dry-run" option was used.');
        return process.exit(0);
      }

      if (sumanOpts.find_only || sumanOpts.$findOnly) {
        _suman.log.info('exiting here, because "--find-only" option was used.');
        return process.exit(0);
      }

      const d = domain.create();

      d.once('error', function (err: Error) {
        console.error('\n');
        _suman.log.error(chalk.magenta('fatal error => ' + (err.stack || err) + '\n'));
        process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
      });

      // note: if only one file is used with the runner, then there is no possible blocking,
      // so we can ignore the suman.order.js file, and pretend it does not exist.

      const forceRunner = sumanOpts.browser || sumanOpts.runner || sumanOpts.coverage || sumanOpts.containerize;

      if (IS_SUMAN_SINGLE_PROCESS && !forceRunner) {

        console.log(ascii.suman_slant, '\n');

        return d.run(() => {
          changeCWDToRootOrTestDir(projectRoot);

          if (sumanOpts.rand) {
            files = shuffle(files);
          }
          _suman.sumanSingleProcessStartTime = Date.now();
          require('./run-child-not-runner').run(su.removeSharedRootPath(files));
        });
      }

      if (!forceRunner && files.length === 1 && su.checkStatsIsFile(files[0]) && !nonJSFile) {
        console.log(ascii.suman_slant, '\n');
        return d.run(() => {
          changeCWDToRootOrTestDir(files[0]);
          require('./run-child-not-runner').run(files);
        });
      }

      _suman.processIsRunner = true;
      d.run(() => {
        require('./runner-helpers/create-suman-runner').run({runObj: obj});
      });

    });
};
