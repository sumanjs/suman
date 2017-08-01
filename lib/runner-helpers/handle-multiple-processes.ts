'use strict';
import {IRunnerObj, IRunnerRunFn, IRunObj, ISumanChildProcess, ITableRows} from "../../dts/runner";
import {IPseudoError} from "../../dts/global";

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
import semver = require('semver');

const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
import {events} from 'suman-events';
import su from 'suman-utils';
import * as async from 'async';

const noFilesFoundError = require('../helpers/no-files-found-error');
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});
const runnerUtils = require('./runner-utils');
import {cpHash, socketHash, ganttHash, IGanttHash, IGanttData} from './socket-cp-hash';

const {getTapParser} = require('./handle-tap');
const {getTapJSONParser} = require('./handle-tap-json');
const {constants} = require('../../config/suman-constants');
const debug = require('suman-debug')('s:runner');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import onExitFn from './multiple-process-each-on-exit';
import pt from 'prepend-transform';

const runChildPath = require.resolve(__dirname + '/run-child.js');
import uuidV4 = require('uuid/v4');

/////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ISumanCPMessages {
  code: number,
  signal: any
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeHandleMultipleProcesses =

  function (runnerObj: IRunnerObj, tableRows: ITableRows, messages: Array<ISumanCPMessages>,
            forkedCPs: Array<ISumanChildProcess>, handleMessage: Function,
            beforeExitRunOncePost: Function, makeExit: Function): Function {

    return function (runObj: IRunObj) {

      debugger;

      _suman.startDateMillis = Date.now();

      const {sumanOpts, sumanConfig, maxProcs, projectRoot, userArgs: args} = _suman;
      const waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;

      _suman.log('waitForAllTranformsToFinish => ', chalk.magenta(waitForAllTranformsToFinish));

      let queuedTestFns: Array<Function> = [];
      let failedTransformObjects: Array<Object> = [];

      const transpileQueue = async.queue(function (task: Function, cb: Function) {

        task(function (err: Error, file: string, shortFile: string, stdout: string, stderr: string, gd: IGanttData) {

          setImmediate(cb);

          if (err) {
            _suman.logError('tranpile error => ', err.stack || err);
            failedTransformObjects.push({err, file, shortFile, stdout, stderr});
            return;
          }

          if (waitForAllTranformsToFinish) {
            queuedTestFns.push(function () {
              outer(file, shortFile, stdout, gd);
            });
          }
          else {
            outer(file, shortFile, stdout, gd);
          }
        });

      }, 3);

      if (waitForAllTranformsToFinish) {
        transpileQueue.drain = function () {
          // => execute all queued tests
          _suman.log('all transforms complete, beginning to run first set of tests.');
          queuedTestFns.forEach(function (fn) {
            fn();
          });
        }
      }

      if (sumanOpts.$useTAPOutput) {
        if (sumanOpts.verbosity > 4) {
          console.log(chalk.gray.bold(' => Suman runner is expecting TAP output from Node.js child processes ' +
            'and will not be listening for websocket messages.'));
        }
      }

      // handleBlocking gets initialized weirdly in runner.js, but we will deal for now
      const handleBlocking = runnerObj.handleBlocking;

      if (_suman.usingLiveSumanServer) {
        args.push('--live_suman_server');
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
        SUMAN_RUN_CHILD_STATIC_PATH: runChildPath,
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

      const execFile = path.resolve(__dirname + '/run-child.js');
      const istanbulExecPath = _suman.istanbulExecPath || 'istanbul';
      const isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
      const isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;

      fileObjArray.forEach(function (fileShortAndFull: Array<Array<string>>) {

        const uuid = String(uuidV4());
        const file = fileShortAndFull[0];
        const shortFile = fileShortAndFull[1];
        const filePathFromProjectRoot = fileShortAndFull[2];

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

        //TODO: we should used uuid here instead
        tableRows[shortFile] = {
          actualExitCode: null,
          shortFilePath: shortFile,
          tableData: null,
          defaultTableData: {
            SUITES_DESIGNATOR: basename
          }
        };

        const gd = ganttHash[uuid] = {
          uuid: uuid,
          fullFilePath: String(file),
          shortFilePath: String(shortFile),
          filePathFromProjectRoot: String(filePathFromProjectRoot),
          // transformStartDate: null,
          // transformEndDate: null,
          // startDate: null,
          // endDate: null
        } as any;

        const tr = (sumanOpts.no_transpile !== true) && runnerUtils.findPathOfTransformDotSh(file);

        if (tr) {

          transpileQueue.push(function (cb: Function) {

            su.makePathExecutable(tr, function (err: Error) {

              if (err) {
                return cb(err);
              }

              gd.transformStartDate = Date.now();

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

              const ln = String(_suman.projectRoot).length;

              if (sumanOpts.inherit_all_stdio || sumanOpts.inherit_transform_stdio || process.env.SUMAN_INHERIT_STDIO) {

                let onError = function (e: Error) {
                  console.error('\n', e.stack || e, '\n');
                };

                k.stderr.pipe(pt(` [${chalk.red('transform process stderr:')} ${chalk.red.bold(String(file.slice(ln)))}] `))
                .on('error', onError).pipe(process.stderr).on('error', onError);

                k.stdout.pipe(pt(` [${chalk.yellow('transform process stdout:')} ${chalk.gray.bold(String(file.slice(ln)))}] `))
                .on('error', onError).pipe(process.stdout).on('error', onError);
              }

              // let strm = fs.createWriteStream(path.resolve(tr + '.log'));
              //
              // k.stderr.pipe(strm).on('error', function (e: Error) {
              //   throw e;
              // });
              //
              // k.stdout.pipe(strm).on('error', function (e: Error) {
              //   throw e;
              // });

              let stdout = '';
              k.stdout.on('data', function (data: string) {
                stdout += data;
              });

              let stderr = '';
              k.stderr.on('data', function (data: string) {
                stderr += data;
              });

              k.once('close', function (code: number) {

                gd.transformEndDate = Date.now();

                if (code > 0) {
                  cb(new Error(`the @transform.sh process, for file ${file},\nexitted with non-zero exit code. :( 
                  \n To see the stderr, use --inherit-stdio.`));
                }
                else {
                  cb(null, file, shortFile, stdout, stderr, gd);
                }

              });

            });

          });

        }
        else {
          // we don't need to run any transform, so we run right away
          gd.transformStartDate = gd.transformEndDate = null;
          gd.wasTransformed = false;
          transpileQueue.unshift(function (cb: Function) {
            setImmediate(function () {
              // there is no applicable stdout/stderr, so we pass empty string
              cb(null, file, shortFile, '', '', gd);
            });
          });
        }
      });

      let childId = 1;

      const outer = function (file: string, shortFile: string, stdout: string, gd: IGanttData) {

        const run = <IRunnerRunFn> function () {

          if (runnerObj.bailed) {
            // should not fork any more child processes if we have bailed
            if (sumanOpts.verbosity > 4) {
              console.log(' => Suman => "--bailed" option was passed and was tripped, ' +
                'no more child processes will be forked.');
            }
            return;
          }

          const argz = JSON.parse(JSON.stringify(args));

          const execArgz = ['--expose-gc'];

          if (sumanOpts.debug_child) {
            execArgz.push('--debug-brk');
            execArgz.push('--debug=' + (5303 + runnerObj.processId++));
          }

          if (sumanOpts.inspect_child) {
            if (semver.gt(process.version, '7.8.0')) {
              execArgz.push('--inspect-brk');
            }
            else {
              execArgz.push('--inspect');
              execArgz.push('--debug-brk');
            }
          }

          let execArgs;

          if (execArgs = sumanOpts.exec_arg) {
            execArgs.forEach(function (n: string) {
              if (n) {
                execArgz.push(String(n).trim());
              }
            });

            String(execArgs).split(/S+/).forEach(function (n) {
              if (n) {
                execArgz.push('--' + String(n).trim());
              }
            });
          }

          const $execArgz = execArgz.filter(function (e, i) {
            // filter out duplicate command line args
            if (execArgz.indexOf(e) !== i) {
              console.error('\n', chalk.yellow(' => Warning you have duplicate items in your exec args => '),
                '\n' + util.inspect(execArgz), '\n');
            }
            return true;
          });

          let n: ISumanChildProcess, hashbang = false;

          const extname = path.extname(shortFile);

          let $childId = childId++;

          const inherit = _suman.$forceInheritStdio ? 'inherit' : '';

          if (inherit) {
            _suman.log('we are inheriting stdio of child, because of sumanception.');
          }

          let cpOptions = {
            detached: false,
            cwd: projectRoot,
            // cwd: sumanOpts.force_cwd_to_be_project_root ? projectRoot : path.dirname(file),
            stdio: [
              'ignore',
              inherit || (isStdoutSilent ? 'ignore' : 'pipe'),
              inherit || (isStderrSilent ? 'ignore' : 'pipe'),
              'ipc'  //TODO: assume 'ipc' is ignored if not a .js file..
            ],
            env: Object.assign({}, sumanEnv, {
              SUMAN_CHILD_TEST_PATH: file,
              SUMAN_CHILD_TEST_PATH_TARGET: file,
              SUMAN_TRANSFORM_STDOUT: stdout,
              SUMAN_CHILD_ID: String($childId)
            })
          };

          // we run the file directly, hopefully it has a hashbang
          let sh = runnerUtils.findPathOfRunDotSh(file);

          if (sh) {

            //force to project root
            cpOptions.cwd = projectRoot;
            su.isSumanDebug(function () {
              console.log('found sh => ', sh);
            });

            try {
              fs.chmodSync(sh, 0o777);
            }
            catch (err) {

            }

            if (sumanOpts.coverage) {
              _suman.logWarning(chalk.magenta('coverage option was set to true, but we are running your tests via @run.sh.'));
              _suman.logWarning(chalk.magenta('so in this case, you will need to run your coverage call via @run.sh.'));
            }
            _suman.log('We have found the sh file => ', sh);
            n = cp.spawn(sh, argz, cpOptions) as ISumanChildProcess;
          }
          else {

            if ('.js' === extname) {

              if (sumanOpts.coverage) {
                let coverageDir = path.resolve(_suman.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
                n = cp.spawn(istanbulExecPath,
                  //'--include-all-sources'
                  ['cover', execFile, '--dir', coverageDir, '--'].concat(args), cpOptions) as ISumanChildProcess;
              }
              else {
                argz.unshift(execFile);
                let argzz = $execArgz.concat(argz); // append exec args to beginning
                n = cp.spawn('node', argzz, cpOptions) as ISumanChildProcess;
              }

            }
            else {
              // .sh .bash .py, perl, ruby, etc
              console.log('perl bash python or ruby file ? => ', file);
              hashbang = true;
              n = cp.spawn(file, argz, cpOptions) as ISumanChildProcess;
            }
          }

          cpHash[$childId] = n;

          if (!_suman.weAreDebugging) {
            n.to = setTimeout(function () {
              console.error(' => Suman killed child process because it timed out => \n',
                (n.fileName || n.filename));
              n.kill('SIGINT');
              setTimeout(function () {
                n.kill('SIGKILL');
              }, 18000);
            }, 6000000);
          }

          n.testPath = file;
          n.shortTestPath = shortFile;

          forkedCPs.push(n);

          n.on('message', function (msg) {
            _suman.logError('Suman runner does not handle standard Node.js IPC messages.');
          });

          n.on('error', function (err) {
            _suman.logError('error spawning child process => ', console.error(err.stack || err));
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
              _suman.logError('n.stdio is defined even though we are in sumanception territory.');
            }

            n.stdout.setEncoding('utf8');
            n.stderr.setEncoding('utf8');

            if (false && (sumanOpts.inherit_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes')) {

              let onError = function (e: Error) {
                console.error('\n', e.stack || e, '\n');
              };

              n.stdout.pipe(pt(chalk.cyan(' => [suman child stdout] => ')))
              .on('error', onError).pipe(process.stdout).on('error', onError);
              n.stderr.pipe(pt(chalk.red.bold(' => [suman child stderr] => ')))
              .on('error', onError).pipe(process.stderr).on('error', onError);
            }

            // if (true || sumanOpts.$useTAPOutput) {
            //   n.tapOutputIsComplete = false;
            //   n.stdout.pipe(getTapParser())
            //   .on('error', function (e: Error) {
            //     _suman.logError('error parsing TAP output => ', e.stack || e);
            //   })
            //   .once('finish', function () {
            //     n.tapOutputIsComplete = true;
            //     process.nextTick(function () {
            //       n.emit('tap-output-is-complete', true);
            //     });
            //   });
            // }

            if (true || sumanOpts.$useTAPOutput) {
              n.tapOutputIsComplete = false;
              n.stdout.pipe(getTapJSONParser())
              .on('error', function (e: Error) {
                _suman.logError('error parsing TAP JSON output => ', e.stack || e);
              })
              .once('finish', function () {
                n.tapOutputIsComplete = true;
                process.nextTick(function () {
                  n.emit('tap-output-is-complete', true);
                });
              });
            }

            n.stdio[2].setEncoding('utf-8');
            n.stdio[2].on('data', function (data) {

              const d = String(data).split('\n').filter(function (line) {
                return String(line).length;
              }).map(function (line) {
                return '[' + n.shortTestPath + '] ' + line;
              }).join('\n');

              _suman.sumanStderrStream.write('\n\n');
              _suman.sumanStderrStream.write(d);

              if (_suman.weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
                //TODO: go through code and make sure that no console.log statements should in fact be console.error
                console.log('pid => ', n.pid, 'stderr => ', d);
              }
            });

          }
          else {
            if (su.vgt(2)) {
              _suman.logWarning('Stdio object not available for child process.');
            }
          }

          n.dateStartedMillis = gd.startDate = Date.now();
          n.once('exit',
            onExitFn(n, runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, gd));

        };

        run.testPath = file;
        run.shortTestPath = shortFile;

        if (handleBlocking.runNext(run)) {
          if (su.vgt(3) || su.isSumanDebug()) {
            _suman.log('File has just started running =>', file, '\n');
          }
        }
        else {
          runnerObj.queuedCPs.push(run);
          _suman.log('File is blocked by Suman runner =>', file);
          if (su.isSumanDebug()) {
            _suman.log('File is blocked by Suman runner =>', file);
          }
        }

        if (waitForAllTranformsToFinish) {

          if (forkedCPs.length < 1 && runnerObj.queuedCPs.length > 0) {
            throw new Error(' => Suman internal error => fatal start order algorithm error, ' +
              'please file an issue on Github, thanks.');
          }

          if (forkedCPs.length < 1) {
            noFilesFoundError(files);
          }
          else {
            const totalCount = forkedCPs.length + runnerObj.queuedCPs.length;
            const suites = totalCount === 1 ? 'suite' : 'suites';
            const processes = totalCount === 1 ? 'process' : 'processes';
            resultBroadcaster.emit(String(events.RUNNER_INITIAL_SET), forkedCPs, processes, suites);
            const addendum = maxProcs < totalCount ? ' with no more than ' + maxProcs + ' running at a time.' : '';
            resultBroadcaster.emit(String(events.RUNNER_OVERALL_SET), totalCount, processes, suites, addendum);
          }

        }

      };

    }

  };
