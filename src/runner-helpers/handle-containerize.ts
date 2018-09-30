'use strict';
import {IRunnerObj, IRunnerRunFn, IRunObj, ISumanChildProcess, ITableRows} from "suman-types/dts/runner";
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

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
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
import {events} from 'suman-events';
import * as su from 'suman-utils';
import * as async from 'async';
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import * as ru from './runner-utils';
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import {pt} from 'prepend-transform';

/////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ISumanCPMessages {
  code: number,
  signal: any
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeContainerize =

  function (runnerObj: IRunnerObj, tableRows: ITableRows, messages: Array<ISumanCPMessages>,
            forkedCPs: Array<ISumanChildProcess>, handleMessage: Function,
            beforeExitRunOncePost: Function, makeExit: Function): Function {

    return function (runObj: IRunObj) {

      _suman.startDateMillis = Date.now();
      const {sumanOpts, sumanConfig, maxProcs, projectRoot, userArgs: args} = _suman;
      const waitForAllTranformsToFinish = true;

      let failedTestObjects: Array<Object> = [];
      let queuedTestObjects: Array<Object> = [];

      const transpileQueue = async.queue(function (task: Function, cb: Function) {

        task(function (err: Error | string, file: string, shortFile: string, stdout: string, pathFromProjecRoot: string) {

          // when fired, this cb will start the next item in the queue
          setImmediate(cb);

          if (err) {
            _suman.log.error('transpile error => ', su.getCleanErrorString(err));
            failedTestObjects.push({err, file, shortFile, stdout, pathFromProjecRoot});
          }
          else {
            queuedTestObjects.push({file, shortFile, stdout, pathFromProjecRoot});
          }
        });

      }, 4);

      transpileQueue.drain = function () {
        // => execute all queued tests
        _suman.log.info('all transforms complete, beginning to run first set of tests.');

        const p = path.resolve(__dirname + '/../dockerize/make-dockerized-tests.sh');
        // const files = queuedTestObjects.map(v => "'" + v.file + "'").join(' ');
        const files = queuedTestObjects.map(function (v) {
          if (String(v.pathFromProjecRoot).startsWith('/')) {
            return String(v.pathFromProjecRoot).slice(1);
          }
          return v.pathFromProjecRoot;
        });

        console.log('short files => ', files);
        const filesStr = files.join(' ');
        console.log('short filesStr => ', filesStr);

        const k = cp.spawn(p, [filesStr, '--no-transpile']);

        k.stdout.pipe(process.stdout);
        k.stderr.pipe(process.stderr);

        k.once('exit', function (code) {
          console.log('containerized tests exitted with code => ', code);
          process.exit(code);
        });

      };

      if (sumanOpts.$useTAPOutput) {
        if (sumanOpts.verbosity > 7) {
          _suman.log.info(chalk.gray.bold('Suman runner is expecting TAP output from Node.js child processes ' +
            'and will not be listening for IPC messages.'));
        }
      }

      let files = runObj.files;

      //TODO: need to remove duplicate files before calling resultBroadcaster
      resultBroadcaster.emit(String(events.RUNNER_STARTED), files.length);

      if (_suman.sumanOpts.rand) {
        files = shuffle(files);
      }

      runnerObj.startTime = Date.now();

      const fileObjArray = su.removeSharedRootPath(files);

      const sumanEnv = Object.assign({}, process.env, {
        SUMAN_CONFIG: JSON.stringify(sumanConfig),
        SUMAN_OPTS: JSON.stringify(sumanOpts),
        SUMAN_RUNNER: 'yes',
        SUMAN_RUN_ID: _suman.runId,
        SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
        NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes')
      });

      if (_suman.socketServerPort > 0) {
        sumanEnv['SUMAN_SOCKETIO_SERVER_PORT'] = _suman.socketServerPort;
      }

      fileObjArray.forEach(function (fileShortAndFull: Array<Array<string>>) {

        const file = fileShortAndFull[0];
        const shortFile = fileShortAndFull[1];
        console.log('fileShortAndFull', fileShortAndFull);
        const pathFromRoot = fileShortAndFull[2];

        // const basename = path.basename(file);
        let basename = file.length > 28 ? ' ' + String(file).substring(Math.max(0, file.length - 28)) + ' ' : file;

        const m = String(basename).match(/\//g);

        if (m && m.length > 1) {
          const arr = String(basename).split('');
          let i = 0;
          while (arr[i] !== '/') {
            arr.shift();
          }
          basename = arr.join('');
        }

        tableRows[shortFile] = {
          actualExitCode: null,
          shortFilePath: shortFile,
          tableData: null,
          defaultTableData: {
            SUITES_DESIGNATOR: basename
          }
        };

        const tr = ru.findPathOfTransformDotSh(file);

        if (tr) {

          transpileQueue.push(function (cb: Function) {

            su.makePathExecutable(tr, function (err: Error) {

              if (err) {
                return cb(err);
              }

              let k = cp.spawn(tr, [], {
                cwd: projectRoot,
                env: Object.assign({}, process.env, {
                  SUMAN_TEST_PATHS: JSON.stringify([file]),
                  SUMAN_CHILD_TEST_PATH: file
                })
              });

              k.once('error', cb);

              k.stderr.setEncoding('utf8');
              k.stdout.setEncoding('utf8');

              if (sumanOpts.inherit_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes') {

                let onError = function (e: Error) {
                  console.error('\n', su.getCleanErrorString(e), '\n');
                };

                k.stderr.pipe(pt(`${chalk.red('=> transform process stderr => ')} ${file}\n`, {omitWhitespace: true}))
                .on('error', onError).pipe(process.stderr).on('error', onError);

                k.stdout.pipe(pt(` => transform process stdout => ${file}\n`))
                .on('error', onError).pipe(process.stdout).on('error', onError);
              }

              let stdout = '';
              k.stdout.on('data', function (data: string) {
                stdout += data;
              });

              k.once('close', function (code: number) {

                if (code > 0) {
                  cb(new Error(`the @transform.sh process, for file ${file},\nexitted with non-zero exit code. :(
                   \n To see the stderr, use --inherit-stdio.`));
                }
                else {
                  cb(null, file, shortFile, stdout, pathFromRoot);
                }

              });

            });

          });

        }
        else {
          // we don't need to run any transform, so we run right away
          transpileQueue.unshift(function (cb: Function) {
            setImmediate(function () {
              // there is no applicable stdout, so we pass empty string
              cb(null, file, shortFile, '', pathFromRoot);
            });
          });
        }
      });

    }

  };
