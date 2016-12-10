'use strict';

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const domain = require('domain');
const util = require('util');
const cp = require('child_process');

//npm
const async = require('async');
const _ = require('lodash');
const colors = require('colors/safe');
const sumanUtils = require('suman-utils/utils');
const rimraf = require('rimraf');
const events = require('suman-events');

//project
const ascii = require('./helpers/ascii');
const constants = require('../config/suman-constants');
const makeNetworkLog = require('./make-network-log');
const findSumanServer = require('./find-suman-server');
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (opts, paths, sumanServerInstalled, originalTranspileOption, sumanVersion) {

  const projectRoot = global.projectRoot;
  const timestamp = global.timestamp = Date.now();
  const networkLog = global.networkLog = makeNetworkLog(timestamp);
  const server = global.server = findSumanServer(null);
  const testDir = process.env.TEST_DIR;
  const testSrcDir = process.env.TEST_SRC_DIR;
  const testTargerDir = process.env.TEST_TARGET_DIR;
  const makeSumanLog = process.env.MAKE_SUMAN_LOG = 'yes';
  const ssp = process.env.SUMAN_SINGLE_PROCESS;

  // make sure we are not issuing Suman command from wrong directory
  // this should get refactored into runner get-file-paths.js
  require('./helpers/vet-paths')(paths);

  function checkStatsIsFile(item) {

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

  function checkIfJSFile(item) {
    console.log('=> path item => ', typeof item, util.inspect(item));
    return path.extname(item) === '.js';
  }

  var originalPaths = null;
  var originalPathsMappedToTranspilePaths = null;

  console.log("TRANSPILING => ", opts.transpile);


  if (paths.length < 1) {
    if (testSrcDir) {
      paths = [testSrcDir];
    }
    else {
      throw new Error(' => Suman usage error => No "testSrcDir" prop specified in config or by command line.');
    }
  }


  async.series({

    watchFiles: function (cb) {
      //TODO: This is just for reference in case we need a serial task ahead of the parallel tasks
      return process.nextTick(cb);
    },

    parallelTasks: function (cb) {

      async.parallel({

        rimrafLogs: function (cb) {

          const sumanCPLogs = path.resolve(global.sumanHelperDirRoot + '/logs/tests');
          rimraf(sumanCPLogs, function (err) {
            if (err) {
              cb(err);
            }
            else {
              fs.mkdir(sumanCPLogs, 0o777, cb);
            }
          });

        },
        npmList: function (cb) {

          // return process.nextTick(cb);

          //TODO: this was causing problems, skip for now
          var callable = true;

          const to = setTimeout(first, 600);

          function first() {
            if (callable) {
              clearTimeout(to);
              callable = false;
              cb.apply(null, arguments);
            }
          }

          cp.exec('npm view suman version', function (err, stdout, stderr) {

            clearTimeout(to);

            if (err || String(stdout).match(/error/i) || String(stderr).match(/error/)) {
              first(err || stdout || stderr);
            }
            else {
              if (callable && String(stdout) !== String(sumanVersion)) {
                console.log(' => Newest Suman version in the NPM registry:', stdout, ', current version =>', sumanVersion);
              }

              first(null, stdout);
            }
          });
        },


        seriesTasks: function (cb) {

          async.series({

            getFilesToRun: function (cb) {

              console.log('BOOOOM!');
              //TODO: get-file-paths should become async, not sync
              cb(null, require('./runner-helpers/get-file-paths')(paths));

            },

            parallelTasks: function (cb) {

              async.parallel({
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
              }, cb);

            },


          }, cb);
        },

        acquireLock: function (cb) {
          networkLog.createNewTestRun(server, cb);
        }

      }, cb);
    }

  }, function complete(err, results) {

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

    if (true || opts.vverbose) {
      console.log('=> Suman vverbose message => "$ npm list -g" results: ', results.parallelTasks.npmList);
    }

    function changeCWDToRootOrTestDir(p) {
      if (opts.cwd_is_root) {
        process.chdir(projectRoot);
      }
      else {
        process.chdir(path.dirname(p));  //force CWD to test file path // boop boop
      }
    }


    // under certain conditions paths will get reassigned above

    console.log('results.parallelTasks.getFilesToRun => ', results.parallelTasks.getFilesToRun);
    paths = results.parallelTasks.getFilesToRun || paths;

    if (opts.transpile) {

      //TODO: probably don't need original paths, but if we do, we should set them before actually transpiling (above)
      // originalPaths = _.flatten(paths).map(function (item) {
      //   return path.resolve(path.isAbsolute(item) ? item : (projectRoot + '/' + item));
      // });

      //TODO: get targetPath separately than transpiling
      paths = results.parallelTasks.seriesTasks.transpileFiles.map(item => item.targetPath);
    }


    // note: safeguard in case something really weird happened, might want to do a big data dump here
    if (paths.length < 1) {
      console.error('\n\t' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
      console.error('\n   ' + colors.bgYellow.black(' => And, importantly, no testDir property is present in your suman.conf.js file. ') + '\n\n');
      return process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILE_OR_DIR_SPECIFIED);
    }


    // nonJSFile will be undefined if we didn't run get-file-paths above
    const nonJSFile = !!paths.nonJSFile;
    const d = domain.create();

    d.once('error', function (err) {
      //TODO: add link showing how to set up Babel
      console.error(colors.magenta(' => Suman fatal error (domain caught) => \n' + (err.stack || err) + '\n'));
      process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    });


    resultBroadcaster.emit(events.RUNNER_TEST_PATHS_CONFIRMATION,
      ['\n ' + colors.bgBlack.white.bold(' Suman will attempt to execute test ' +
        'files with/within the following paths: '), '\n\n',
        paths.map((p, i) => '\t ' + (i + 1) + ' => ' + colors.cyan('"' + p + '"')).join('\n') + '\n\n\n'].join(''));

    if (opts.vverbose) {
      console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => ' +
        'Suman will execute test files from the following locations:'), '\n', paths, '\n');
    }

    //TODO: if only one file is used with the runner, then there is no possible blocking,
    // so we can ignore the suman.order.js file,
    // and pretend it does not exist.

    if (opts.coverage) {
      require('./run-coverage/exec-istanbul')(paths, opts.recursive);
    }
    else if (ssp === 'yes' && !opts.runner) {

      console.log(ascii.suman_slant, '\n');
      d.run(function () {
        process.nextTick(function () {
          changeCWDToRootOrTestDir(projectRoot);

          if (opts.rand) {
            paths = _.shuffle(paths);
          }
          global.sumanSingleProcessStartTime = Date.now();
          require('./run-child-not-runner')(sumanUtils.removeSharedRootPath(paths));
        });
      });
    }
    else if (!opts.runner && paths.length === 1 && checkStatsIsFile(paths[0]) && nonJSFile == false) {

      console.log(ascii.suman_slant, '\n');
      //TODO: we could read file in (fs.createReadStream) and see if suman is referenced
      d.run(function () {
        process.nextTick(function () {
          changeCWDToRootOrTestDir(paths[0]);
          require('./run-child-not-runner')(paths);
        });
      });
    }
    else {

      const sumanRunner = require('./create-suman-runner');

      console.log(' => PATHS => ', util.inspect(paths));

      d.run(function () {
        process.nextTick(function () {
          sumanRunner({

            $node_env: process.env.NODE_ENV,
            files: paths

          }).on('message', function (msg) {
            //TODO: one day runner might be in separate processs, maybe on separate machine, who knows
            console.log(' => Messsage from suman runner', msg);
          });
        });
      });
    }

  });
};
