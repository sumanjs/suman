'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const domain = require('domain');
const util = require('util');
const cp = require('child_process');

//npm
const async = require('async');
const shuffle = require('lodash.shuffle');
const colors = require('colors/safe');
const su = require('suman-utils');
const rimraf = require('rimraf');
const {events} = require('suman-events');
const debug = require('suman-debug')('s:cli');
const uuid = require('uuid/v4');
const mkdirp = require('mkdirp');

//project
const _suman = global.__suman = (global.__suman || {});
const sumanHome = path.resolve(process.env.HOME + '/.suman');
const noFilesFoundError = require('./helpers/no-files-found-error');
const ascii = require('./helpers/ascii');
const {constants} = require('../config/suman-constants');
const makeNetworkLog = require('./make-network-log');
const findSumanServer = require('./find-suman-server');
const {findFilesToRun} = require('./runner-helpers/get-file-paths');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const dbPth = path.resolve(process.env.HOME + '/.suman/database/exec_db');
const getIstanbulPath = require('./helpers/get-istanbul-exec-path.js');

//////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (opts, paths, sumanServerInstalled, sumanVersion) {

  const logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
  const sumanCPLogs = path.resolve(logsDir + '/runs');

  debugger;  //leave here forever so users can easily debug

  let sql;
  try {
    sql = require('sqlite3').verbose();
  }
  catch (err) {
    console.error('\n', err.stack, '\n');
    console.error(colors.yellow.bold(' => Looks like Suman could not find "sqlite3" NPM dependency.'));
    console.error(' => Suman uses NODE_PATH to source heavier dependencies from a shared location.');
    console.error(' => If you use the suman command, NODE_PATH will be set correctly.');

    if (process.env.NODE_PATH) {
      console.error(' => $NODE_PATH currently has this value => ', process.env.NODE_PATH);
    }
    else {
      console.error(' => $NODE_PATH is currently ' + colors.yellow('*not*') + ' defined.');
    }

    console.error(' => If for whatever reason you ran node against the suman cli.js file, ' +
      'then NODE_PATH may not be set correctly.');
    console.error(' => Try "$ NODE_PATH=$NODE_PATH:~/.suman/global/node_modules node <your-file.js>"');
    if (!_suman.sumanOpts.force) {
      return process.exit(1);
    }
  }

  let runId = _suman.runId = process.env.SUMAN_RUN_ID = null;
  const projectRoot = _suman.projectRoot;
  const timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP = Date.now();
  const networkLog = _suman.networkLog = makeNetworkLog(timestamp);
  const server = _suman.server = findSumanServer(null);
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

    removeCoverageDir: function (cb) {

      if (_suman.sumanOpts.coverage) {
        const covDir = path.resolve(_suman.projectRoot + '/coverage');
        rimraf(covDir, function () {
          fs.mkdir(covDir, cb);
        });
      }
      else {
        process.nextTick(cb);
      }

    },

    getIstanbulPath: function (cb) {
      if (_suman.sumanOpts.coverage) {
        getIstanbulPath(function (err, p) {
          err ? cb(err) : (function () {
            _suman.istanbulExecPath = p;
            cb();
          })();
        });
      }
      else {
        process.nextTick(cb);
      }

    },

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

        if (err && !String(err).match(/EEXIST/i)) {
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
            // let p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
            // fs.mkdir(p, 0o777, cb);
            return process.nextTick(cb);
          }

        }, cb);

      });

    },
    npmList: function (cb) {

      return process.nextTick(cb);

      //TODO: this was causing problems, skip for now
      let callable = true;

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

      let callable = true;
      const first = function () {
        if (callable) {
          callable = false;
          cb.apply(null, arguments);
        }
      };

      let slack;
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
          config: _suman.sumanConfig
        })

      }, err => {

        clearTimeout(to);
        if (err) {
          debug(err.stack || err);
        }
        first(null);
      });
    },

    checkIfTSCMultiWatchLock: function (cb) {

      //fs.exists is deprecated
      fs.stat(path.resolve(projectRoot + '/suman-watch.lock'), function (err) {
        if (!err) {
          _suman.multiWatchReady = true;
        }
        cb();
      });
    },

    transpileFiles: function (cb) {

      //TODO: transpile files should be after finding files
      if (opts.transpile && !opts.useBabelRegister) {
        su.runTranspile(paths, opts, cb);
      }
      else {
        process.nextTick(cb);
      }
    },

    getFilesToRun: function (cb) {
      findFilesToRun(paths, opts, function (err, obj) {

        if (err) {
          return err;
        }

        su.findSumanMarkers(['@run.sh', '@transform.sh'], testSrcDir, obj.files, function (err, map) {
          _suman.markersMap = map;
          fs.writeFile(_suman.sumanHelperDirRoot + '/suman-map.json', JSON.stringify(map), function () {
            cb(err, obj);
          });
        });
      });
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

      let callable = true;

      function first () {
        if (callable) {
          callable = false;
          cb.apply(this, arguments);
        }
      }

      function createDir (runId) {
        let p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
        fs.mkdir(p, 0o777, first);
      }

      if (!sql) {
        runId = _suman.runId = process.env.SUMAN_RUN_ID = uuid();
        return createDir(runId);
      }

      const db = new sql.Database(dbPth, function (err) {
        if (err) {
          return first(err);
        }

        db.configure('busyTimeout', 4000);
        db.once('error', first);

        db.serialize(function () {
          db.run('BEGIN EXCLUSIVE TRANSACTION;');
          db.all('SELECT run_id from suman_run_id', function (err, rows) {
            if (err) {
              first(err);
            }
            else {
              db.serialize(function () {

                if (rows.length > 1) {
                  console.log(' => Suman internal warning => "suman_run_id" rows length is greater than 1.');
                }

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

    if (opts.verbosity > 999) {
      //TODO: this is not ready yet
      console.log('=> Suman verbose message => "$ npm list -g" results: ', results.npmList);
    }

    function changeCWDToRootOrTestDir (p) {
      if (opts.cwd_is_root) {
        process.chdir(projectRoot);
      }
      else {
        process.chdir(path.dirname(p));  //force CWD to test file path!
      }
    }

    const obj = results.getFilesToRun;

    let files = obj.files;
    const nonJSFile = !!obj.nonJSFile;

    if (files.length < 1) {
      return noFilesFoundError(paths);
    }

    const d = domain.create();

    d.once('error', function (err) {
      console.error(colors.magenta(' => Suman fatal error => \n' + (err.stack || err) + '\n'));
      process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    });

    resultBroadcaster.emit(String(events.RUNNER_TEST_PATHS_CONFIRMATION), files);

    if (opts.verbosity > 2) {
      console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => ' +
        'Suman will execute test files from the following locations:'), '\n', files, '\n');
    }

    //TODO: if only one file is used with the runner, then there is no possible blocking,
    // so we can ignore the suman.order.js file,
    // and pretend it does not exist.

    if (ssp === 'yes' && !opts.runner && !opts.coverage) {

      console.log(ascii.suman_slant, '\n');

      d.run(function () {
        changeCWDToRootOrTestDir(projectRoot);

        if (opts.rand) {
          files = shuffle(files);
        }
        _suman.sumanSingleProcessStartTime = Date.now();
        require('./run-child-not-runner')(su.removeSharedRootPath(files));
      });
    }
    else if (!opts.runner && !opts.coverage && files.length === 1 && checkStatsIsFile(files[0]) && !nonJSFile) {

      console.log(ascii.suman_slant, '\n');
      //TODO: we could read file in (fs.createReadStream) and see if suman is referenced
      d.run(function () {
        changeCWDToRootOrTestDir(files[0]);
        require('./run-child-not-runner')(files);
      });
    }
    else {

      const sumanRunner = require('./create-suman-runner');
      _suman.processIsRunner = true;

      d.run(function () {
        sumanRunner({
          $node_env: process.env.NODE_ENV,
          runObj: obj
        });
      });
    }
  });
};
