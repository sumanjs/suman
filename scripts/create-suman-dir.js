#!/usr/bin/env node

//core
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

//npm
const async = require('async');

//project
const sumanUtils = require('suman-utils/utils');

///////////////////////////////////////////////////////////////////////////

const cwd = process.cwd();
const userHomeDir = path.resolve(sumanUtils.getHomeDir());
const sumanHome = path.resolve(userHomeDir + '/.suman');
const findSumanExec = path.resolve(sumanHome + '/find-local-suman-executable.js');
const sumanClis = path.resolve(sumanHome + '/suman-clis.sh');
const findProjectRootDest = path.resolve(sumanHome + '/find-project-root.js');
const sumanDebugLog = path.resolve(sumanHome + '/suman-debug.log');
const dbPath = path.resolve(sumanHome + '/database/exec_db');
const createTables = path.resolve(__dirname + '/create-tables.sh');

///////////////////////////////////////////////////
const queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');
const debug = require('suman-debug')('s:postinstall');

//////////////////////////////////////////////////////////////////////////////////////////////////

debug(' => In Suman postinstall script, cwd => ', cwd);
debug(' => In Suman postinstall script => ', __filename);
debug(' => Suman home dir path => ', sumanHome);

fs.mkdir(sumanHome, function (err) {

  if (err && !String(err.stack || err).match(/EEXIST/)) {
    console.error(err.stack || err);
    process.exit(1);
    return;
  }

  async.parallel([

    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      const dbDir = path.resolve(sumanHome + '/database');
      fs.mkdir(dbDir, function (err) {
        if (err && !String(err).match(/EEXIST/)) {
          return cb(err);
        }
        cb(null);
      });
    },

    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      const globalDir = path.resolve(sumanHome + '/global');
      fs.mkdir(globalDir, function (err) {
        if (err && !String(err).match(/EEXIST/)) {
          return cb(err);
        }
        cb(null);
      });
    },

    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      fs.readFile(require.resolve('./suman-clis.sh'), function (err, data) {
        if (err) {
          cb(err);
        }
        else {
          fs.writeFile(sumanClis, data, cb);
        }
      });

    },
    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      fs.readFile(require.resolve('./find-local-suman-executable.js'), function (err, data) {
        if (err) {
          cb(err);
        }
        else {
          // default flag is 'w'
          fs.writeFile(findSumanExec, data, cb);
        }
      });

    },
    function (cb) {
      fs.writeFile(sumanDebugLog, '\n\n => Suman post-install script run on ' + new Date()
        + ', from directory (cwd) => ' + cwd, cb);
    },
    function (cb) {
      // we want to create the file if it doesn't exist, and just write empty string either way
      // default flag is 'a'
      fs.appendFile(queue, '', cb);
    },
    function (cb) {
      fs.readFile(require.resolve('./find-project-root.js'), function (err, data) {
        if (err) {
          cb(err);
        }
        else {
          // default flag is 'w'
          fs.writeFile(findProjectRootDest, data, cb);
        }
      });

    }

  ], function (err) {

    if (err) {
      try {
        fs.appendFileSync(sumanDebugLog, '\n => Suman post-install script failed with error => \n' + (err.stack || err));
      }
      catch (err) {
        //ignore
      }
      console.error(err.stack || err);
      process.exit(1);
    }
    else {

      const n = cp.spawn('bash', [createTables], {
        env: Object.assign({}, process.env, {
          SUMAN_DATABASE_PATH: dbPath
        })
      });

      n.stderr.on('data', function (d) {
        fs.appendFileSync(sumanDebugLog, d);
      });

      n.once('close', function (code) {

        n.unref();

        if (code > 0) {
          process.exit(1);
          return;
        }

        try {
          if (fs.existsSync(sumanHome)) {
            process.exit(0);
          }
          else {
            console.error(' => Warning => ~/.suman dir does not exist!');
            process.exit(1)
          }
        }
        catch (err) {
          console.error(err.stack || err);
          process.exit(1);
        }

      });

    }

  });

});
