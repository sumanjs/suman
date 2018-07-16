'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IGanttData} from "../socket-cp-hash";
import {IRunnerRunFn, ISumanChildProcess, IRunnerObj} from "suman-types/dts/runner";
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
import chalk from 'chalk';
import semver = require('semver');
import su = require('suman-utils');
import {events} from 'suman-events';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getTapParser, getTapJSONParser} from '../handle-tap';
import pt from 'prepend-transform';
import uuid = require('uuid');
import {findPathOfRunDotSh} from '../runner-utils'
import {constants} from "../../config/suman-constants";
import {makeHandleDifferentExecutables} from './handle-different-executables';
const runChildPath = require.resolve(__dirname + '/../run-child.js');
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////

export const makeAddToRunQueue = function (runnerObj: IRunnerObj, args: Array<string>, runQueue: AsyncQueue<Function>,
                                           projectRoot: string, cpHash: Object, forkedCPs: Array<any>,
                                           onExitFn: Function) {

  const {sumanOpts, sumanConfig, maxProcs} = _suman;
  const isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
  const isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
  const debugChildren = sumanOpts.debug_child || sumanOpts.inspect_child;
  const inheritRunStdio = debugChildren || sumanOpts.inherit_stdio ||
    sumanOpts.inherit_all_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes';
  const {handleRunDotShFile, handleRegularFile} = makeHandleDifferentExecutables(projectRoot, sumanOpts, runnerObj);
  let childId = 1;

  const sumanEnv = Object.assign({}, process.env, {
    SUMAN_RUN_CHILD_STATIC_PATH: runChildPath,
    SUMAN_CONFIG: JSON.stringify(sumanConfig),
    SUMAN_OPTS: JSON.stringify(sumanOpts),
    SUMAN_RUNNER: 'yes',
    SUMAN_PROJECT_ROOT: projectRoot,
    SUMAN_RUN_ID: _suman.runId,
    SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
    NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes'),
    SUMAN_SOCKETIO_SERVER_PORT: _suman.socketServerPort > 0 ? _suman.socketServerPort : undefined
  });

  return function (file: string, shortFile: string, stdout: string, gd: IGanttData) {

    runQueue.push(function (cb: Function) {

      if (runnerObj.bailed) {
        // should not fork any more child processes if we have bailed
        if (sumanOpts.verbosity > 4) {
          _suman.log.info('"--bailed" option was passed and was tripped, ' +
            'no more child processes will be forked.');
        }
        return;
      }

      const argz = JSON.parse(JSON.stringify(args));
      let  hashbang = false;
      let $childId = childId++;
      let childUuid = uuid.v4();
      const inherit = sumanOpts.$forceInheritStdio ? 'inherit' : '';

      if (inherit) {
        _suman.log.info('we are inheriting stdio of child, because of sumanception.');
      }

      let cpOptions = {
        detached: false,
        cwd: projectRoot,
        // cwd: sumanOpts.force_cwd_to_be_project_root ? projectRoot : path.dirname(file),
        stdio: [
          'pipe',
          inherit || (isStdoutSilent ? 'ignore' : 'pipe'),
          inherit || (isStderrSilent ? 'ignore' : 'pipe'),
          // 'ipc'  => we don't need IPC anymore, but also can we assume 'ipc' is ignored if not a .js file?
        ],
        env: Object.assign({}, sumanEnv, {
          SUMAN_CHILD_TEST_PATH: file,
          SUMAN_CHILD_TEST_PATH_TARGET: file,
          SUMAN_TRANSFORM_STDOUT: stdout,
          SUMAN_CHILD_ID: String($childId),
          SUMAN_CHILD_UUID: String(childUuid)
        })
      };

      const onChildProcessStarted = function (err: Error, n: ISumanChildProcess) {
        
        if(err){
          _suman.log.error();
          _suman.log.error(chalk.bold('Error launching child process:'));
          _suman.log.error(err.stack || err.message || err);
        }
        
        if(!n){
          // process did not actually start, likely a spawn error (EACCES)
          throw new Error('child process could not start at all.');
        }

        cpHash[$childId] = n;

        if (!_suman.weAreDebugging) {
          n.to = setTimeout(function () {
            _suman.log.error(`Suman killed a child process because it timed out: '${n.fileName || n.filename}'.`);
            n.kill('SIGINT');
            setTimeout(function () {
              // note that we wait 8 seconds for the child process to clean up before sending it a SIGKILL signal
              n.kill('SIGKILL');
            }, 8000);
          }, constants.DEFAULT_CHILD_PROCESS_TIMEOUT);
        }

        n.testPath = file;
        n.shortTestPath = shortFile;
        forkedCPs.push(n);

        n.on('message', function (msg) {
          _suman.log.error('Warning - Suman runner does not handle standard Node.js IPC messages.');
        });

        n.on('error', function (err) {
          _suman.log.error('error spawning child process => ', err.stack || err);
          if (hashbang) {
            console.error('\n');
            console.error(' => The supposed test script file with the following path may not have a hashbang => ');
            console.error(chalk.magenta.bold(file));
            console.error(' => A hashbang is necessary for non-.js files and when there is no accompanying @run.sh file.');
            console.error(' => Without a hashbang, Suman (and your OS) will not know how to run the file.');
            console.error(' => See sumanjs.org for more information.');
          }
        });

        if (n.stdio && n.stdout && n.stderr) {

          if (inherit) {
            _suman.log.error('n.stdio is defined even though we are in sumanception territory.');
          }

          n.stdout.setEncoding('utf8');
          n.stderr.setEncoding('utf8');

          if (false && (sumanOpts.log_stdio_to_files || sumanOpts.log_stdout_to_files || sumanOpts.log_stderr_to_files)) {

            let onError = function (e: Error) {
              _suman.log.error('\n', su.getCleanErrorString(e), '\n');
            };

            let temp = su.removePath(file, _suman.projectRoot);
            let onlyFile = String(temp).replace(/\//g, '.');
            let logfile = path.resolve(file + '/' + onlyFile + '.log');
            let fileStrm = fs.createWriteStream(logfile);

            if (sumanOpts.log_stdio_to_files || sumanOpts.log_stderr_to_files) {
              n.stderr.pipe(fileStrm).once('error', onError);
            }

            if (sumanOpts.log_stdio_to_files || sumanOpts.log_stdout_to_files) {
              n.stdout.pipe(fileStrm).once('error', onError);
            }
          }

          if (inheritRunStdio) {

            let onError = function (e: Error) {
              _suman.log.error('\n', su.getCleanErrorString(e), '\n');
            };

            n.stdout.pipe(pt(chalk.cyan.bold(` [suman child stdout:${n.shortTestPath}] `)))
            .once('error', onError).pipe(process.stdout);
            n.stderr.pipe(pt(chalk.yellow.bold(` [suman child stderr:${n.shortTestPath}] `), {omitWhitespace: true}))
            .once('error', onError).pipe(process.stderr);
          }

          if (true || sumanOpts.$useTAPOutput) {
            n.tapOutputIsComplete = false;
            n.stdout.pipe(getTapParser())
            .on('error', function (e: Error) {
              _suman.log.error('error parsing TAP output =>', su.getCleanErrorString(e));
            })
            .once('finish', function () {
              n.tapOutputIsComplete = true;
              process.nextTick(function () {
                n.emit('tap-output-is-complete', true);
              });
            });
          }

          if (true || sumanOpts.$useTAPJSONOutput) {
            n.tapOutputIsComplete = false;
            n.stdout.pipe(getTapJSONParser())
            .on('error', function (e: Error) {
              _suman.log.error('error parsing TAP-JSON output =>', su.getCleanErrorString(e));
            });
          }

          n.stdio[2].setEncoding('utf-8');
          n.stdio[2].on('data', function (data) {

            const d = String(data).split('\n').filter(function (line) {
              return String(line).length;
            })
            .map(function (line) {
              return '[' + n.shortTestPath + '] ' + line;
            })
            .join('\n');

            _suman.sumanStderrStream.write('\n' + d);

            if (_suman.weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
              //TODO: go through code and make sure that no console.log statements should in fact be console.error
              _suman.log.info('pid => ', n.pid, 'stderr => ', d);
            }
          });

        }
        else {
          if (su.vgt(2)) {
            _suman.log.warning('stdio object not available for child process.');
          }
        }

        rb.emit(String(events.RUNNER_SAYS_FILE_HAS_JUST_STARTED_RUNNING), file);
        n.dateStartedMillis = gd.startDate = Date.now();
        n.once('exit', onExitFn(n, gd, cb));
      };

      // we run the file directly, hopefully it has a hashbang
      let sh = !sumanOpts.ignore_run_config && findPathOfRunDotSh(file);

      if (sh) {
        handleRunDotShFile(sh, argz, file, shortFile, cpOptions, onChildProcessStarted);
      }
      else {
        handleRegularFile(file, shortFile, argz, cpOptions, onChildProcessStarted);
      }

      // if (waitForAllTranformsToFinish) {
      //
      //   if (forkedCPs.length < 1 && runnerObj.queuedCPs.length > 0) {
      //     throw new Error('Suman internal error => fatal start order algorithm error, ' +
      //       'please file an issue on Github, thanks.');
      //   }
      //
      //   if (forkedCPs.length < 1) {
      //     noFilesFoundError(files);
      //   }
      //   else {
      //     const totalCount = forkedCPs.length + runnerObj.queuedCPs.length;
      //     const suites = totalCount === 1 ? 'suite' : 'suites';
      //     const processes = totalCount === 1 ? 'process' : 'processes';
      //     resultBroadcaster.emit(String(events.RUNNER_INITIAL_SET), forkedCPs, processes, suites);
      //     const addendum = maxProcs < totalCount ? ' with no more than ' + maxProcs + ' running at a time.' : '';
      //     resultBroadcaster.emit(String(events.RUNNER_OVERALL_SET), totalCount, processes, suites, addendum);
      //   }
      //
      // }

    });
  }

};
