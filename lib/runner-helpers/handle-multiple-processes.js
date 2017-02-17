'use strict';

//core
const cp = require('child_process');
const path = require('path');
const util = require('util');

//npm
const _ = require('lodash');
const events = require('suman-events');
const sumanUtils = require('suman-utils/utils');
const async = require('async');
const noFilesFoundError = require('../helpers/no-files-found-error');
const colors = require('colors/safe');

//project
const handleTap = require('./handle-tap');
const constants = require('../../config/suman-constants');
const debug = require('suman-debug')('s:runner');
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

const _suman = global._suman;
const maxProcs = _suman.maxProcs;

/////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit) {

  return function runSingleOrMultipleDirs (runObj) {

    // handleBlocking gets initialized weirdly in runner.js, but we will deal for now
    const handleBlocking = runnerObj.handleBlocking;

    const args = [];

    if (global.usingLiveSumanServer) {
      args.push('--live_suman_server');
    }

    var files = runObj.files;
    const filesThatDidNotMatch = runObj.filesThatDidNotMatch;

    filesThatDidNotMatch.forEach(function (val) {
      console.log('\n', colors.bgBlack.yellow(' => Suman message =>  A file in a relevant directory ' +
        'did not match your regular expressions => '), '\n', util.inspect(val));
    });

    //TODO: need to remove duplicate files before calling resultBroadcaster
    resultBroadcaster.emit(events.RUNNER_STARTED, files.length);

    if (global.sumanOpts.rand) {
      files = _.shuffle(files);
    }

    //TODO: need to make sure list of files is unique list, if not report that as non-fatal error

    handleBlocking.determineInitialStarters(files);
    runnerObj.startTime = Date.now();

    const fileObjArray = sumanUtils.removeSharedRootPath(files);

    const sumanEnv = Object.assign({}, process.env, {
      SUMAN_CONFIG: JSON.stringify(global.sumanConfig),
      SUMAN_OPTS: JSON.stringify(global.sumanOpts),
      SUMAN_RUNNER: 'yes',
      SUMAN_RUN_ID: _suman.runId,
      SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
      NPM_COLORS: process.env.NPM_COLORS || (global.sumanOpts.no_color ? 'no' : 'yes')
    });

    const execFile = path.resolve(__dirname + '/run-child.js');
    const istanbulExecPath = global._suman.istanbulExecPath;

    fileObjArray.forEach(function (fileShortAndFull, index) {

      const file = fileShortAndFull[0];
      const shortFile = fileShortAndFull[1];

      // const basename = path.basename(file);
      var basename = file.length > 28 ? ' ' + String(file).substring(Math.max(0, file.length - 28)) + ' ' : file;

      const m = String(basename).match(/\//g);

      if (m && m.length > 1) {
        const arr = String(basename).split('');
        var i = 0;
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

      function run () {
        const execArgz = ['--expose-gc', '--harmony'];

        if (weAreDebugging) {
          if (!global.sumanOpts.ignore_break) {  //NOTE: this allows us to focus on debugging runner
            execArgz.push('--debug-brk');
          }
          execArgz.push('--debug=' + (5303 + runnerObj.processId++));
        }

        const ext = _.merge({env: {SUMAN_CHILD_TEST_PATH: file}}, {
          cwd: global.sumanOpts.force_cwd_to_be_project_root ? projectRoot : path.dirname(file),
          // stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
          stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
          execArgv: execArgz,
          env: sumanEnv,
          detached: false   //TODO: detached:false works but not true
        });

        var n;

        const extname = path.extname(shortFile);

        if (global.sumanOpts.coverage && '.js' === extname) {
          const coverageDir = path.resolve(global.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
          n = cp.spawn(istanbulExecPath,
            ['cover', execFile, '--dir', coverageDir, '--include-all-sources', '--'].concat(args), ext);
        }
        else if ('.js' === extname) {

          // n = cp.fork(execFile, argz, ext);
          argz.unshift(execFile);
          n = cp.spawn('node', argz, ext);
        }
        // else if('.sh'  === extname){
        //   argz.unshift(file);
        //   console.log('args => ', argz);
        //   n = cp.spawn('exec', argz, ext);
        // }
        else {   // .sh .bash .python, perl, ruby, etc

          if(global.sumanOpts.coverage){
            console.log(colors.magenta(' => Suman warning => You wish for coverage with Istanbul/NYC,\nbut these tools' +
              'cannot run coverage against files that cannot be run with node.js.'));
          }
          // we run the file directly, hopefully it has a hashbang
          // n = cp.spawn('exec', argz, ext);
          n = cp.spawn(file, argz, ext);
        }

        if (!weAreDebugging) {
          n.to = setTimeout(function () {
            n.kill('SIGKILL');
          }, 60000);
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
        });

        if (n.stdio /*false && global.sumanOpts.no_silent !== true*/) {

          n.stdout.setEncoding('utf8');
          n.stderr.setEncoding('utf8');

          if (false) {
            n.stdout.pipe(process.stdout);
            n.stderr.pipe(process.stderr);
          }

          if (true || global.useTAPOutput) {
            n.tapOutputIsComplete = false;
            n.stdout.pipe(handleTap())
            .once('finish', function () {
              n.tapOutputIsComplete = true;
              process.nextTick(function () {
                n.emit('tap-output-is-complete', true);
              });
            });
          }

          // n.stdout.on('data', function (d) {
          //   console.log('\n', d);
          // });

          n.stdio[2].setEncoding('utf-8');
          n.stdio[2].on('data', function (data) {

            const d = String(data).split('\n').filter(function (line) {
              return String(line).length;
            }).map(function (line) {
              return '[' + n.shortTestPath + '] ' + line;
            }).join('\n');

            global.sumanStderrStream.write('\n\n');
            global.sumanStderrStream.write(d);

            if (weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
              //TODO: go through code and make sure that no console.log statements should in fact be console.error
              console.log('pid => ', n.pid, 'stderr => ', d);
            }

          });

        }
        else {
          console.log(' => Stdio not available for child process.');
        }

        n.once('exit', function (code, signal) {

          resultBroadcaster.emit(events.TEST_FILE_CHILD_PROCESS_EXITED, {
            testPath: n.testPath,
            exitCode: code
          });

          if (process.env.SUMAN_DEBUG === 'yes') {
            console.log('\n', colors.black.bgYellow(' => process given by => ' + n.shortTestPath + ' exited with code: ' + code + ' '), '\n');
          }

          if (process.env.SUMAN_DEBUG === 'yes') {
            global.timeOfMostRecentExit = Date.now();
          }

          n.removeAllListeners();

          const originalExitCode = JSON.parse(JSON.stringify(code));

          if (n.expectedExitCode !== undefined) {
            if (code === n.expectedExitCode) {
              code = 0;
            }
            // else{  // do not need this because child process should handle this
            //    code = constants.EXIT_CODES.EXPECTED_EXIT_CODE_NOT_MET;
            // }
          }

          runnerObj.doneCount++;
          messages.push({code: code, signal: signal});
          tableRows[n.shortTestPath].actualExitCode = n.expectedExitCode !== undefined ?
            n.expectedExitCode + '/' + originalExitCode : originalExitCode;

          //TODO: if bail, need to make that clear to user here
          if ((runnerObj.bailed = (code > 0 && global.sumanOpts.bail)) ||
            (runnerObj.doneCount >= forkedCPs.length && runnerObj.queuedCPs.length < 1)) {


            runnerObj.endTime = Date.now();
            runnerObj.listening = false;

            function waitForTAP(){
              beforeExitRunOncePost(function (err) {
                makeExit(messages, runnerObj.endTime - runnerObj.startTime);
              });
            }

            if('tapOutputIsComplete' in n){
              if(n.tapOutputIsComplete === true){
                process.nextTick(waitForTAP);
              }
              else{
                n.once('tap-output-is-complete', waitForTAP);
              }
            }
            else{
              process.nextTick(waitForTAP);
            }

          }
          else {
            handleBlocking.releaseNextTests(n.testPath, runnerObj);
            if (process.env.SUMAN_DEBUG === 'yes') {
              console.log(' => Time required to release next test(s) => ', Date.now() - global.timeOfMostRecentExit, 'ms');
            }
          }
        });

      }

      run.testPath = file;
      run.shortTestPath = shortFile;

      if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
        runnerObj.queuedCPs.push(run);
        if (process.env.SUMAN_DEBUG == 'yes') {
          console.log('File is blocked =>', file);
        }
      }
      else {
        run();
        if (process.env.SUMAN_DEBUG == 'yes') {
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
      resultBroadcaster.emit(events.RUNNER_INITIAL_SET, forkedCPs, processes, suites);
      const addendum = maxProcs < totalCount ? ' with no more than ' + maxProcs + ' running at a time.' : '';
      resultBroadcaster.emit(events.RUNNER_OVERALL_SET, totalCount, processes, suites, addendum);
    }

  }

};
