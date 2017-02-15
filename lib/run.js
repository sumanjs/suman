'use strict';

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const domain = require('domain');
const util = require('util');
const cp = require('child_process');

//npm
const sql = require('sqlite3').verbose();
const async = require('async');
const _ = require('lodash');
const colors = require('colors/safe');
const sumanUtils = require('suman-utils/utils');
const rimraf = require('rimraf');
const events = require('suman-events');
const debug = require('suman-debug')('s:cli');
const uuid = require('uuid/v4');
const mkdirp = require('mkdirp');

//project
const sumanHome = path.resolve(process.env.HOME + '/.suman');
const noFilesFoundError = require('./helpers/no-files-found-error');
const ascii = require('./helpers/ascii');
const constants = require('../config/suman-constants');
const makeNetworkLog = require('./make-network-log');
const findSumanServer = require('./find-suman-server');
const findFilesToRun = require('./runner-helpers/get-file-paths');
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////////////////////////////////

const dbPth = path.resolve(process.env.HOME + '/.suman/database/exec_db');

const sumanCPLogs = path.resolve(global.sumanHelperDirRoot + '/logs/runs');

//////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (opts, paths, sumanServerInstalled, sumanVersion) {

  debugger;  //leave here forever so users can easily debug

  const _suman = global._suman;
  var runId = _suman.runId = process.env.SUMAN_RUN_ID = null;
  const projectRoot = global.projectRoot;
  const timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP = Date.now();
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

  function checkStatsIsFile (item) {

    debug([' => SUMAN_DEBUG => checking if "' + item + '" is a file.']);

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

  var originalPaths = null;
  var originalPathsMappedToTranspilePaths = null;

  debug(' => transpiling? => ', opts.transpile);
  debug(' => useBabelRegiser ? => ', opts.useBabelRegister);

  if (paths.length < 1) {
    if (testSrcDir) {
      paths = [testSrcDir];
    }
    else {
      throw new Error(' => Suman usage error => No "testSrcDir" prop specified in config or by command line.');
    }
  }

  async.parallel({

    mkdirs: function (cb) {

      async.series([
        function (cb) {
          mkdirp(path.resolve(sumanHome + '/global'), cb);
        },
        function (cb) {
          mkdirp(path.resolve(sumanHome + '/database'), cb);
        }
      ], cb);

    },

    rimrafLogs: function (cb) {

      fs.mkdir(sumanCPLogs, function (err) {

        if (err && !String(err).match(/EEXIST/)) {
          return cb(err);
        }

        async.parallel({

          removeOld: function (cb) {

            fs.readdir(sumanCPLogs, function (err, items) {
              if (err) {
                return cb(err);
              }

              // we only keep the most recent 5 items, everything else we delete
              items.sort().reverse().splice(0, Math.min(items.length, 4));

              async.each(items, function (item, cb) {
                const pitem = path.resolve(sumanCPLogs + '/' + item);
                rimraf(pitem, cb); // ignore callback
              }, cb);

            });

          },

          createNew: function (cb) {
            // var p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
            // fs.mkdir(p, 0o777, cb);
            return process.nextTick(cb);
          }

        }, cb);

      });

    },
    npmList: function (cb) {

      return process.nextTick(cb);

      //TODO: this was causing problems, skip for now
      var callable = true;

      const to = setTimeout(first, 800);

      function first () {
        if (callable) {
          clearTimeout(to);
          callable = false;
          cb.apply(null, arguments);
        }
      }

      const n = cp.spawn('npm', ['view', 'suman', 'version'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      n.on('close', first);

      n.stdout.setEncoding('utf8');
      n.stderr.setEncoding('utf8');

      n.stdout.on('data', function (data) {
        const remoteVersion = String(data).replace(/\s+/, '');
        const localVersion = String(sumanVersion).replace(/\s+/, '');
        if (callable && remoteVersion !== localVersion) {
          console.log(colors.red(' => Newest Suman version in the NPM registry:', remoteVersion, ', current version =>', localVersion));
        }
        else {
          console.log(colors.red(' => Good news, your Suman version is up to date with latest version on NPM'));
        }
      });

      n.stderr.on('data', function (data) {
        console.error(data);
      });

    },

    slack: function (cb) {

      if (!process.env.SLACK_TOKEN) {
        return process.nextTick(cb);
      }

      var callable = true;
      const first = function () {
        if (callable) {
          callable = false;
          cb.apply(null, arguments);
        }
      };

      var slack;
      try {
        slack = require('slack');
      }
      catch (err) {
        debug(err.stack);
        return process.nextTick(first);
      }

      const to = setTimeout(function () {
        first(null);
      }, 200);

      slack.chat.postMessage({

        token: process.env.SLACK_TOKEN,
        channel: '#suman-all-commands',
        text: JSON.stringify({
          command: process.argv,
          config: global.sumanConfig
        })

      }, (err) => {
        clearTimeout(to);
        if (err) {
          debug(err.stack || err);
        }
        first(null);
      });
    },

    transpileFiles: function (cb) {

      if (opts.transpile && !opts.useBabelRegister) {
        require('./transpile/run-transpile')(paths, opts, cb);
      }
      else {
        process.nextTick(cb);
      }
    },

    getFilesToRun: function (cb) {

      //TODO: get-file-paths should become async, not sync
      findFilesToRun(paths, opts, cb);

    },

    conductStaticAnalysisOfFilesForSafety: function (cb) {
      if (false && opts.safe) {
        cb(new Error('safe option not yet implemented'));
      }
      else {
        process.nextTick(cb);
      }
    },

    acquireLock: function (cb) {
      networkLog.createNewTestRun(server, cb);
    },

    getRunId: function (cb) {

      var callable = true;

      function first () {
        if (callable) {
          callable = false;
          cb.apply(this, arguments);
        }
      }

      function createDir (runId) {
        var p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
        fs.mkdir(p, 0o777, first);
      }

      const db = new sql.Database(dbPth, function (err) {
        if (err) {
          return first(err);
        }

        db.configure('busyTimeout',4000);

        db.once('error', first);

        db.serialize(function () {
          db.run('BEGIN EXCLUSIVE TRANSACTION;');
          db.all('SELECT run_id from suman_run_id', function (err, rows) {
            if(err){
              first(err);
            }
            else{
              db.serialize(function () {
                const val = rows[0] ? rows[0].run_id : 1;
                runId = _suman.runId = process.env.SUMAN_RUN_ID = val;
                const updatedValue = val + 1;
                db.run('UPDATE suman_run_id SET run_id = ' + updatedValue);
                db.run('COMMIT TRANSACTION;', function (err) {
                  db.close();
                  err ? first(err) : createDir(runId);
                });
              });
            }
          });
        });
      });

    }

  }, function complete (err, results) {

    if (err) {
      console.error('\n\n => Suman fatal pre-run problem => ' + (err.stack || err), '\n\n');
      return process.exit(1);
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

    debug([' => results => ', results]);
    debug([' => results.getFilesToRun => ', results.getFilesToRun]);
    debug([' => results.transpileFiles => ', results.transpileFiles]);

    const obj = results.getFilesToRun;

    var files = obj.files;
    const nonJSFile = !!obj.nonJSFile;

    // note: safeguard in case something really weird happened, might want to do a big data dump here
    if (files.length < 1) {
      return noFilesFoundError(paths);
    }

    const d = domain.create();

    d.once('error', function (err) {
      //TODO: add link showing how to set up Babel
      console.error(colors.magenta(' => Suman fatal error (domain caught) => \n' + (err.stack || err) + '\n'));
      process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    });

    resultBroadcaster.emit(events.RUNNER_TEST_PATHS_CONFIRMATION, files);

    if (opts.vverbose) {
      console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => ' +
        'Suman will execute test files from the following locations:'), '\n', files, '\n');
    }

    //TODO: if only one file is used with the runner, then there is no possible blocking,
    // so we can ignore the suman.order.js file,
    // and pretend it does not exist.

    if (opts.coverage) {
      require('./run-coverage/exec-istanbul')(files, opts.recursive);
    }
    else if (ssp === 'yes' && !opts.runner) {

      console.log(ascii.suman_slant, '\n');
      d.run(function () {
        process.nextTick(function () {
          changeCWDToRootOrTestDir(projectRoot);

          if (opts.rand) {
            files = _.shuffle(files);
          }
          global.sumanSingleProcessStartTime = Date.now();
          require('./run-child-not-runner')(sumanUtils.removeSharedRootPath(files));
        });
      });
    }
    else if (!opts.runner && files.length === 1 && checkStatsIsFile(files[0]) && nonJSFile == false) {

      console.log(ascii.suman_slant, '\n');
      //TODO: we could read file in (fs.createReadStream) and see if suman is referenced
      d.run(function () {
        process.nextTick(function () {
          changeCWDToRootOrTestDir(files[0]);
          require('./run-child-not-runner')(files);
        });
      });
    }
    else {

      const sumanRunner = require('./create-suman-runner');
      global._suman.processIsRunner = true;

      d.run(function () {
        process.nextTick(function () {
          sumanRunner({

            $node_env: process.env.NODE_ENV,
            runObj: obj

          }).on('message', function (msg) {
            //TODO: one day runner might be in separate processs, maybe on separate machine, who knows
            console.log(' => Messsage from suman runner', msg);
          });
        });
      });
    }

  });
};
