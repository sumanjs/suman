'use strict';

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const domain = require('domain');
const cp = require('child_process');

//npm
const async = require('async');
const _ = require('lodash');
const colors = require('colors/safe');
const sumanUtils = require('suman-utils/utils');

//project
const events = require('../events');
const constants = require('../config/suman-constants');
const makeNetworkLog = require('./make-network-log');
const findSumanServer = require('./find-suman-server');
const resultBroadcaster = global.resultBroadcaster = global.resultBroadcaster || new EE();


module.exports = function (opts, paths, sumanServerInstalled, originalTranspileOption) {

  const projectRoot = global.projectRoot;

  const timestamp = global.timestamp = Date.now();
  const networkLog = global.networkLog = makeNetworkLog(timestamp);
  const server = global.server = findSumanServer(null);

  const testDir = process.env.TEST_DIR;
  const testSrcDir = process.env.TEST_SRC_DIR;
  const testTargerDir = process.env.TEST_TARGET_DIR;

  function checkStatsIsFile (item) {

    if (process.env.SUMAN_DEBUG === 'yes') {
      console.log(' => SUMAN_DEBUG => checking if "' + item + '" is a file.');
    }

    try {
      return fs.statSync(item).isFile();
    }
    catch (err) {
      if (opts.verbose) {
        console.error(' => Suman verbose warning => ', err.stack);
      }
      return null;
    }
  }

  if (paths.length < 1) {
    paths = [ testSrcDir ];
  }

  async.series({

    watchFiles: function (cb) {

      //TODO: why is watch files serially in line here?
      return process.nextTick(cb);

      // if (opts.watch) {
      //
      //   if (!sumanServerInstalled) {
      //     process.nextTick(function () {
      //       cb(new Error(' => Suman server is not installed yet => Please use "$ suman --use-server" ' +
      //         'in your local project.'));
      //     });
      //   }
      //   else {
      //     require('./watching/add-watcher')(paths, cb);
      //   }
      //
      // }
      // else if (opts.stop_watching) {
      //   require('./watching/stop-watching')(paths, cb);
      // }
      // else {
      //   process.nextTick(cb);
      // }

    },

    parallelTasks: function (cb) {

      async.parallel({
        npmList: function (cb) {

          return process.nextTick(cb);

          //TODO: this was causing problems, skip for now

          var callable = true;

          const to = setTimeout(first, 600);

          function first () {
            if (callable) {
              clearTimeout(to);
              callable = false;
              cb(null);
            }
          }

          cp.exec('npm view suman version', function (err, stdout, stderr) {
            if (err || String(stdout).match(/error/i) || String(stderr).match(/error/)) {
              first(err || stdout || stderr);
            }
            else {
              if (callable && String(stdout) !== String(sumanVersion)) {
                console.log(' => Newest Suman version in the NPM registry:', stdout, ', current version =>', sumanVersion);
              }

              first(null);
            }
          });
        },

        transpileFiles: function (cb) {

          if (originalTranspileOption || (!opts.watch && opts.transpile)) {
            require('./transpile/run-transpile')(paths, opts, cb);
          }
          else {
            process.nextTick(function () {
              cb(null, []);
            });
          }
        },

        conductStaticAnalysisOfFilesForSafety: function (cb) {
          if (opts.safe) {
            cb(new Error('safe option not yet implemented'));
          }
          else {
            process.nextTick(cb);
          }
        },

        acquireLock: function (cb) {
          networkLog.createNewTestRun(server, cb);
        }

      }, cb);
    }

  }, function complete (err, results) {

    if (err) {
      console.log('\n\n => Suman fatal problem => ' + (err.stack || err), '\n\n');
      return process.exit(1);
    }

    if (opts.watch) {
      console.log('\n\n\t => Suman server running locally now listening for files changes ' +
        'and will run and/or transpile tests for you as they change.');
      console.log('\n\n\t => Suman message => the ' + colors.magenta('--watch') + ' option is set, ' +
        'we are done here for now.');
      console.log('\t To view the options and values that will be used to initiate a Suman test run, ' +
        'use the --verbose or --vverbose options\n\n');
      return process.exit(0);
    }

    if (opts.stop_watching) {
      console.log('\n\n\t => Suman message => the ' + colors.magenta('--no-run') + ' option is set, ' +
        'we are done here for now.');
      console.log('\t To view the options and values that will be used to initiate a Suman test run, ' +
        'use the --verbose or --vverbose options\n\n');
      return process.exit(0);
    }

    if (opts.vverbose) {
      console.log('=> Suman vverbose message => "$ npm list -g" results: ', results.npmList);
    }

    function changeCWDToRootOrTestDir (p) {
      if (opts.cwd_is_root) {
        process.chdir(projectRoot);
      }
      else {
        process.chdir(path.dirname(p));  //force CWD to test file path // boop boop
      }
    }

    const d = domain.create();

    d.once('error', function (err) {
      //TODO: add link showing how to set up Babel
      console.error(colors.magenta(' => Suman fatal error (domain caught) => ' + (err.stack || err) + '\n'));
      process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    });

    var originalPaths = null;
    var originalPathsMappedToTranspilePaths = null;

    if (opts.transpile) {

      originalPaths = _.flatten(paths).map(function (item) {
        return path.resolve(path.isAbsolute(item) ? item : (projectRoot + '/' + item));
      });

      if (paths.length < 1) {
        paths = [ testTargetDir ];
      }
      else {
        paths = results.parallelTasks.transpileFiles.map(item => item.targetPath);
      }

    }
    else {

      if (paths.length < 1) {
        if (testSrcDir) {
          paths = [ testSrcDir ];
        }
        else {
          throw new Error(' => Suman usage error => No "testSrcDir" prop specified in config or by command line.');
        }
      }
    }

    if (paths.length < 1) {
      console.error('\n\t' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
      console.error('\n   ' + colors.bgYellow.black(' => And, importantly, no testDir property is present in your suman.conf.js file. ') + '\n\n');
      process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILE_OR_DIR_SPECIFIED);
    }
    else {

      paths = paths.map(function (item) {
        return path.resolve(path.isAbsolute(item) ? item : (projectRoot + '/' + item));
      });

      resultBroadcaster.emit(events.RUNNER_TEST_PATHS_CONFIRMATION,
        ['\n ' + colors.bgBlack.white.bold(' Suman will attempt to execute test ' +
          'files with/within the following paths: '), '\n\n',
        paths.map((p, i) => '\t ' + (i + 1) + ' => ' + colors.cyan('"' + p + '"')).join('\n') + '\n'].join(''));


      if (opts.vverbose) {
        console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => ' +
          'Suman will execute test files from the following locations:'), '\n', paths, '\n');
      }

      //TODO: if only one file is used with the runner, then there is no possible blocking,
      // so we can ignore the suman.order.js file,
      // and pretend it does not exist.

      if (opts.coverage) {

        var istanbulInstallPath;
        try {
          istanbulInstallPath = require.resolve('istanbul');
          if (opts.verbose) {
            console.log(' => Suman verbose message => install path of instabul => ', istanbulInstallPath);
          }

        }
        catch (e) {
          if (!opts.force) {
            console.log('\n', ' => Suman message => Looks like istanbul is not installed globally, you can run "$ suman --use-istanbul", to acquire the right deps.');
            console.log('\n', ' => Suman message => If installing "istanbul" manually, you may install locally or globally, Suman will pick it up either way.');
            console.log('\t => To override this, use --force.', '\n');
            return;
          }
        }

        require('./run-coverage/exec-istanbul')(istanbulInstallPath, paths, opts.recursive);

      }
      else if (process.env.SUMAN_SINGLE_PROCESS === 'yes' && !opts.runner) {
        //TODO: note that
        d.run(function () {
          process.nextTick(function () {
            changeCWDToRootOrTestDir(projectRoot);
            var files = require('./runner-helpers/get-file-paths')(paths);

            if (opts.rand) {
              files = _.shuffle(files);
            }
            global.sumanSingleProcessStartTime = Date.now();
            require('./run-child-not-runner')(sumanUtils.removeSharedRootPath(files));
          });
        });
      }
      else if (!opts.runner && paths.length === 1 && checkStatsIsFile(paths[ 0 ])) {

        //TODO: we could read file in (fs.createReadStream) and see if suman is referenced
        d.run(function () {
          process.nextTick(function () {
            changeCWDToRootOrTestDir(paths[ 0 ]);
            require('./run-child-not-runner')(paths);
          });
        });
      }
      else {

        const sumanRunner = require('./create-suman-runner');

        d.run(function () {
          process.nextTick(function () {
            sumanRunner({
              $node_env: process.env.NODE_ENV,
              fileOrDir: paths
              //configPath: configPath || 'suman.conf.js'
            }).on('message', function (msg) {
              console.log('msg from suman runner', msg);
              //process.exit(msg);
            });
          });
        });
      }
    }
  });
};