'use strict';

//core
const cp = require('child_process');
const path = require('path');
const util = require('util');

//npm
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
const events = require('suman-events');
const su = require('suman-utils');
const async = require('async');
const noFilesFoundError = require('../helpers/no-files-found-error');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const runnerUtils = require('./runner-utils');
const handleTap = require('./handle-tap');
const constants = require('../../config/suman-constants');
const debug = require('suman-debug')('s:runner');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

/////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit) {

  return function runSingleOrMultipleDirs(runObj) {

    const maxProcs = _suman.maxProcs;

    if (_suman.sumanOpts.useTAPOutput) {
      if (_suman.sumanOpts.verbosity > 7) {
        console.log(colors.gray.bold(' => Suman runner is expecting TAP output from Node.js child processes ' +
          'and will not be listening for IPC messages.'));
      }
    }

    // handleBlocking gets initialized weirdly in runner.js, but we will deal for now
    const handleBlocking = runnerObj.handleBlocking;

    const args = _suman.userArgs;

    if (_suman.usingLiveSumanServer) {
      args.push('--live_suman_server');
    }

    let files = runObj.files;
    const filesThatDidNotMatch = runObj.filesThatDidNotMatch;

    filesThatDidNotMatch.forEach(function (val) {
      console.log('\n', colors.bgBlack.yellow(' => Suman message =>  A file in a relevant directory ' +
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
      SUMAN_CONFIG: JSON.stringify(_suman.sumanConfig),
      SUMAN_OPTS: JSON.stringify(_suman.sumanOpts),
      SUMAN_RUNNER: 'yes',
      SUMAN_RUN_ID: _suman.runId,
      SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
      NPM_COLORS: process.env.NPM_COLORS || (_suman.sumanOpts.no_color ? 'no' : 'yes')
    });

    const execFile = path.resolve(__dirname + '/run-child.js');
    const istanbulExecPath = _suman.istanbulExecPath;
    const isStdoutSilent = _suman.sumanOpts.stdout_silent || _suman.sumanOpts.silent;
    const isStderrSilent = _suman.sumanOpts.silent;

    fileObjArray.forEach(function (fileShortAndFull, index) {

      const file = fileShortAndFull[0];
      const shortFile = fileShortAndFull[1];

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

      function run() {

        if (runnerObj.bailed) {
          // should not fork any more child processes if we have bailed
          if (_suman.sumanOpts.verbosity > 6) {
            console.log(' => Suman[6] => "--bailed" option was passed and was tripped, ' +
              'no more child processes will be forked.');
          }
          return;
        }
        const execArgz = ['--expose-gc', '--harmony'];

        if (_suman.weAreDebugging) {
          if (!_suman.sumanOpts.ignore_break) {  //NOTE: this allows us to focus on debugging runner
            execArgz.push('--debug-brk');
          }
          execArgz.push('--debug=' + (5303 + runnerObj.processId++));
        }

        let dir = path.dirname(path.dirname(file));
        let filename = path.basename(file);
        let $file = path.resolve(dir + '/target/' + filename);

        let ext = merge({
            env: {
              SUMAN_CHILD_TEST_PATH: file,
              SUMAN_CHILD_TEST_PATH_TARGET: $file
            }
          },
          {
            cwd: _suman.sumanOpts.force_cwd_to_be_project_root ? projectRoot : path.dirname(file),
            stdio: [
              'ignore',
              (isStdoutSilent ? 'ignore' : 'pipe'),
              (isStderrSilent ? 'ignore' : 'pipe'),
              'ipc'  //TODO: assume 'ipc' is ignored if not a .js file..
            ],
            execArgv: execArgz,
            env: sumanEnv,
            detached: false   //TODO: detached:false works but not true
          });

        let n, hashbang = false;

        const tr = runnerUtils.findPathOfTransformDotSh(file);

        if (false && tr) {

          cp.spawnSync(tr, [], {
            env: Object.assign({}, process.env, {
              SUMAN_CHILD_TEST_PATH: file
            })
          });

          console.log('file => ', $file);

        }

        const extname = path.extname(shortFile);

        if (_suman.sumanOpts.coverage && '.js' === extname) {
          let coverageDir = path.resolve(_suman.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
          n = cp.spawn(istanbulExecPath,
            //'--include-all-sources'
            ['cover', execFile, '--dir', coverageDir, '--'].concat(args), ext);
        }
        else if ('.js' === extname) {
          argz.unshift(execFile);
          n = cp.spawn('node', argz, ext);
        }
        // else if('.sh'  === extname){
        //   argz.unshift(file);
        //   console.log('args => ', argz);
        //   n = cp.spawn('exec', argz, ext);
        // }
        else {   // .sh .bash .py, perl, ruby, etc


          if (_suman.sumanOpts.coverage) {
            console.log(colors.magenta(' => Suman warning => You wish for coverage with Istanbul/NYC,\nbut these tools' +
              'cannot run coverage against files that cannot be run with node.js.'));
          }

          // we run the file directly, hopefully it has a hashbang
          let sh = runnerUtils.findPathOfRunDotSh(file);

          if (false && sh) {
            console.log(' => We have found the sh file => ', sh);
            n = cp.spawn(sh, argz, ext);
          }
          else {
            hashbang = true;
            n = cp.spawn(file, argz, ext);
          }

        }

        if (!_suman.weAreDebugging) {
          n.to = setTimeout(function () {
            console.error(' => Suman killed child process because it timed out => \n',
              (n.fileName || n.filename));
            n.kill('SIGKILL');
          }, 600000);
        }

        n.testPath = file;
        n.shortTestPath = shortFile;

        forkedCPs.push(n);

        n.on('message', function (msg) {
          //TODO: this should use handleMessage.bind(n)
          handleMessage(msg, n);
        });

        n.on('error', function (err) {
          console.error('\n', err.stack || err, '\n');
          if (hashbang) {
            console.error('\n');
            console.error(' => The supposed test script file with the following path may not have a hashbang => ');
            console.error(colors.magenta.bold(file));
            console.error(' => A hashbang is necessary for non-.js files and when there is no accompanying @run.sh file.');
            console.error(' => Without a hashbang, Suman (and your OS) will not know how to run the file.');
            console.error(' => See sumanjs.org for more information.');
          }
        });

        if (n.stdio) {

          n.stdout.setEncoding('utf8');
          n.stderr.setEncoding('utf8');

          if (_suman.sumanOpts.inherit_stdio) {
            n.stdout.pipe(process.stdout);
            n.stderr.pipe(process.stderr);
          }

          if (_suman.sumanOpts.useTAPOutput) {

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
          if (su.vgt(8)) {
            console.log(' => Suman(lv.8) => Stdio object not available for child process.');
          }
        }

        n.once('exit', function (code, signal) {

          resultBroadcaster.emit(String(events.TEST_FILE_CHILD_PROCESS_EXITED), {
            testPath: n.testPath,
            exitCode: code
          });

          if (su.isSumanDebug() || su.vgt(5)) {
            console.log('\n',
              colors.black.bgYellow(' => process given by => ' +
                n.shortTestPath + ' exited with code: ' + code + ' '), '\n');
          }

          if (su.isSumanDebug()) {
            _suman.timeOfMostRecentExit = Date.now();
          }

          n.removeAllListeners();

          const originalExitCode = JSON.parse(JSON.stringify(code));

          if (n.expectedExitCode !== undefined) {
            if (code === n.expectedExitCode) {
              code = 0;
            }
          }

          runnerObj.doneCount++;
          messages.push({code: code, signal: signal});
          tableRows[n.shortTestPath].actualExitCode = n.expectedExitCode !== undefined ?
            (n.expectedExitCode + '/' + originalExitCode) : originalExitCode;

          //TODO: if bail, need to make that clear to user here
          if ((runnerObj.bailed = (code > 0 && _suman.sumanOpts.bail)) ||
            (runnerObj.doneCount >= forkedCPs.length && runnerObj.queuedCPs.length < 1)) {

            if (runnerObj.bailed) {
              console.log('\n\n');
              console.log(colors.magenta(' => Suman warning message => ' +
                'We have ' + colors.red.bold('bailed') + ' the test runner because a child process experienced an error ' +
                'and exitted with a non-zero code.'));
              console.log(' => Since we have bailed, Suman will send a SIGTERM signal to any outstanding child processes.');
              forkedCPs.forEach(function (n) {
                n.kill('SIGTERM');
              });
            }
            else {

              if(_suman.sumanOpts.verbosity > 4){
                console.log('\n\n');
                console.log(colors.blue('\t=> Suman message => ') +
                  colors.blue.bold.underline(' All scheduled child processes have exited.'));
                console.log('\n');
              }
            }

            runnerObj.endTime = Date.now();
            runnerObj.listening = false;

            function waitForTAP() {
              async.parallel([
                beforeExitRunOncePost,
                function (cb) {
                  if (_suman.sumanOpts.coverage && !_suman.sumanOpts.no_report) {
                    console.log('\n');
                    console.log(colors.blue.bold(' => Suman is running the Istanbul collated report.'));
                    console.log(colors.blue.bold(' => To disable automatic report generation, use "--no-coverage-report".'));
                    let coverageDir = path.resolve(_suman.projectRoot + '/coverage');
                    const k = cp.spawn(_suman.istanbulExecPath,
                      ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'], {
                        cwd: _suman.projectRoot
                      });

                    // k.stdout.pipe(process.stdout);
                    k.stderr.pipe(process.stderr);

                    k.once('close', function (code) {
                      k.unref();
                      cb(code ? new Error(' => Test coverage exitted with non-zero exit code') : null, code);
                    });
                  }
                  else {
                    process.nextTick(cb);
                  }

                }

              ], function (err) {
                if (err) {
                  console.error(err.stack || err);
                }

                makeExit(messages, {
                  total: runnerObj.endTime - _suman.startTime,
                  runner: runnerObj.endTime - runnerObj.startTime
                });
              });
            }

            if ('tapOutputIsComplete' in n) {
              if (n.tapOutputIsComplete === true) {
                process.nextTick(waitForTAP);
              }
              else {
                n.once('tap-output-is-complete', waitForTAP);
              }
            }
            else {
              process.nextTick(waitForTAP);
            }

          }
          else {
            handleBlocking.releaseNextTests(n.testPath, runnerObj);
            if (su.isSumanDebug()) {
              console.log(' => Time required to release next test(s) => ',
                Date.now() - _suman.timeOfMostRecentExit, 'ms');
            }
          }
        });

      }

      run.testPath = file;
      run.shortTestPath = shortFile;

      if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
        runnerObj.queuedCPs.push(run);
        if (su.isSumanDebug()) {
          console.log(' => File is blocked by Suman runner =>', file);
        }
      }
      else {
        run();
        if (su.isSumanDebug()) {
          console.log(' => File is running =>', file);
        }
      }

    });

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
