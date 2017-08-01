'use strict';
import {IRunnerObj, IRunnerRunFn, IRunObj, ISumanChildProcess, ITableRows} from "../../dts/runner";
import {IPseudoError} from "../../dts/global";
import * as fs from "fs";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const cp = require('child_process');
const path = require('path');
import util = require('util');
const EE = require('events');

//npm
import semver = require('semver');
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
import {events} from 'suman-events';
import su = require('suman-utils');
import async = require('async');
const noFilesFoundError = require('../helpers/no-files-found-error');
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});
const runnerUtils = require('./runner-utils');
const handleTap = require('./handle-tap');
const {constants} = require('../../config/suman-constants');
const debug = require('suman-debug')('s:runner');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import onExitFn from './multiple-process-each-on-exit';
import pt from 'prepend-transform';

/////////////////////////////////////////////////////////////////////////////////////////////////////

export interface ISumanCPMessages {
  code: number,
  signal: any
}

export default function (runnerObj: IRunnerObj, tableRows: ITableRows, messages: Array<ISumanCPMessages>,
                         forkedCPs: Array<ISumanChildProcess>, handleMessage: Function,
                         beforeExitRunOncePost: Function, makeExit: Function): Function {

  return function runSingleOrMultipleDirs(runObj: IRunObj) {

    const {sumanOpts, sumanConfig, maxProcs, projectRoot, userArgs: args} = _suman;

    if (sumanOpts.$useTAPOutput) {
      if (sumanOpts.verbosity > 7) {
        console.log(chalk.gray.bold(' => Suman runner is expecting TAP output from Node.js child processes ' +
          'and will not be listening for IPC messages.'));
      }
    }

    // handleBlocking gets initialized weirdly in runner.js, but we will deal for now
    const handleBlocking = runnerObj.handleBlocking;

    if (_suman.usingLiveSumanServer) {
      args.push('--live_suman_server');
    }

    let files = runObj.files;
    const filesThatDidNotMatch = runObj.filesThatDidNotMatch;

    filesThatDidNotMatch.forEach(function (val) {
      console.log('\n', chalk.bgBlack.yellow(' => Suman message =>  A file in a relevant directory ' +
        'did not match your regular expressions => '), '\n', util.inspect(val));
    });

    //TODO: need to remove duplicate files before calling resultBroadcaster
    resultBroadcaster.emit(String(events.RUNNER_STARTED), files.length);

    if (_suman.sumanOpts.rand) {
      files = shuffle(files);
    }

    //TODO: need to make sure list of files is unique list, if not report that as non-fatal error

    handleBlocking.determineInitialStarters(files);
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

    const execFile = path.resolve(__dirname + '/run-child.js');
    const istanbulExecPath = _suman.istanbulExecPath;
    const isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
    const isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;

    async.eachLimit(fileObjArray, 8, function (fileShortAndFull: Array<string>, cb: Function) {

      // fileObjArray.forEach(function (fileShortAndFull: Array<string>, index: number) {

      const file = fileShortAndFull[0];
      const shortFile = fileShortAndFull[1];

      debugger;

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

      const argz = JSON.parse(JSON.stringify(args));

      const run = <IRunnerRunFn> function () {

        if (runnerObj.bailed) {
          // should not fork any more child processes if we have bailed
          if (sumanOpts.verbosity > 4) {
            console.log(' => Suman => "--bailed" option was passed and was tripped, ' +
              'no more child processes will be forked.');
          }
          return;
        }

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
            _suman.logError('\n', chalk.yellow(' => Warning you have duplicate items in your exec args => '),
              '\n' + util.inspect(execArgz), '\n');
          }
          return true;
        });

        let n: ISumanChildProcess, hashbang = false;

        const runAfterAnyTransform = function (file: string, stdout: string) {

          const extname = path.extname(shortFile);

          let cpOptions = {
            cwd: sumanOpts.force_cwd_to_be_project_root ? projectRoot : path.dirname(file),
            stdio: [
              'ignore',
              (isStdoutSilent ? 'ignore' : 'pipe'),
              (isStderrSilent ? 'ignore' : 'pipe'),
              'ipc'  //TODO: assume 'ipc' is ignored if not a .js file..
            ],
            env: Object.assign({}, sumanEnv, {
              SUMAN_CHILD_TEST_PATH: file,
              SUMAN_CHILD_TEST_PATH_TARGET: file,
              SUMAN_TRANSFORM_STDOUT: stdout
            }),
            detached: false
          };

          // we run the file directly, hopefully it has a hashbang
          let sh = runnerUtils.findPathOfRunDotSh(file);

          if (sh) {
            if (sumanOpts.coverage) {
              _suman.logWarning(chalk.magenta('coverage option was set to true, but we are running your tests via @run.sh.'));
              _suman.logWarning(chalk.magenta('so in this case, you will need to run your coverage call via @run.sh.'));
            }
            _suman.log('We have found the sh file => ', sh);
            n = cp.spawn(sh, argz, cpOptions);
          }
          else {

            if ('.js' === extname) {

              if (su.isSumanDebug()) {
                _suman.log('we are running js file');
              }

              if (sumanOpts.coverage) {
                let coverageDir = path.resolve(_suman.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
                n = cp.spawn(istanbulExecPath,
                  //'--include-all-sources'
                  ['cover', execFile, '--dir', coverageDir, '--'].concat(args), cpOptions);
              }
              else {
                argz.unshift(execFile);

                let argzz = $execArgz.concat(argz); // append exec args to beginning
                n = cp.spawn('node', argzz, cpOptions);
              }

            }
            else {
              // .sh .bash .py, perl, ruby, etc
              hashbang = true;
              n = cp.spawn(file, argz, cpOptions);
            }
          }

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
            //TODO: this should use handleMessage.bind(n)
            handleMessage(msg, n);
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

          if (n.stdio) {

            n.stdout.setEncoding('utf8');
            n.stderr.setEncoding('utf8');

            if (sumanOpts.inherit_stdio) {
              n.stdout.pipe(pt(chalk.bold(' => [suman child stdout] => '))).pipe(process.stdout);
              n.stderr.pipe(pt(chalk.red.bold(' => [suman child stderr] => '))).pipe(process.stderr);
            }

            if (sumanOpts.$useTAPOutput) {

              n.tapOutputIsComplete = false;
              n.stdout.pipe(handleTap())
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
            if (su.vgt(6)) {
              _suman.logWarning('Stdio object not available for child process.');
            }
          }

          n.once('exit', onExitFn(n, runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit));

          cb();
        };

        const tr = runnerUtils.findPathOfTransformDotSh(file);

        if (tr) {

          let k = cp.spawn(tr, [], {
            env: Object.assign({}, process.env, {
              SUMAN_CHILD_TEST_PATH: file
            })
          });

          k.once('error', cb);

          k.stderr.setEncoding('utf8');
          k.stdout.setEncoding('utf8');

          let strm = fs.createWriteStream(path.resolve(tr + '.log'));
          k.stderr.pipe(strm);
          k.stdout.pipe(strm);

          if (sumanOpts.inherit_stdio) {
            k.stderr.pipe(process.stderr);
            k.stdout.pipe(process.stdout);
          }

          let stdout = '';
          k.stdout.on('data', function (data: string) {
            stdout += data;
          });

          k.once('close', function (code: number) {

            if (code > 0) {
              cb(new Error(`the @transform.sh process, for file ${file},\nexitted with non-zero exit code. :( \n To see the stderr, use --inherit-stdio.`));
            }
            else {
              runAfterAnyTransform(file, stdout);
            }

          });

        }
        else {
          // we don't need to run any transform, so we run right away
          setImmediate(function () {
            runAfterAnyTransform(file, '');
          });
        }

      };

      run.testPath = file;
      run.shortTestPath = shortFile;

      if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
        runnerObj.queuedCPs.push(run);
        _suman.log('File is blocked by Suman runner =>', file);
        if (su.isSumanDebug()) {
          _suman.log('File is blocked by Suman runner =>', file);
        }
      }
      else {
        run();
        if (su.vgt(3) || su.isSumanDebug()) {
          _suman.log('File is running =>', file);
        }
      }

    }, function (err: IPseudoError) {

      if (err) {
        throw err;
      }

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

    });

  }

};
