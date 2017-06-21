#!/usr/bin/env node
'use strict';

//core
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

//npm
const residence = require('residence');
const async = require('async');

//project
const su = require('suman-utils');

///////////////////////////////////////////////////////////////////////////

const cwd = process.cwd();
const userHomeDir = path.resolve(su.getHomeDir());
const sumanHome = path.resolve(userHomeDir + '/.suman');
const findSumanExec = path.resolve(sumanHome + '/find-local-suman-executable.js');
const sumanClis = path.resolve(sumanHome + '/suman-clis.sh');
const sumanCompletion = path.resolve(sumanHome + '/suman-completion.sh');
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

function runDatabaseInstalls(err) {

  let logerr = false;

  if (err) {
    try {
      fs.appendFileSync(sumanDebugLog, '\n => Suman post-install initial routine experienced an error => \n' +
        (err.stack || err));
    }
    catch (err) {
      logerr = true;
    }

  }

  const n = cp.spawn('bash', [createTables], {
    env: Object.assign({}, process.env, {
      SUMAN_DATABASE_PATH: dbPath
    })
  });

  n.stderr.setEncoding('utf8');

  if (!logerr) {
    n.stderr.on('data', function (d) {
      fs.appendFileSync(sumanDebugLog, d);
    });
  }

  n.stderr.pipe(process.stderr);

  n.once('close', function (code) {

    n.unref();

    if (code > 0) {
      console.error(' => Suman SQLite routine completed with a non-zero exit code.');
    }

    try {
      if (fs.existsSync(sumanHome)) {
      }
      else {
        console.error(' => Warning => ~/.suman dir does not exist!');
      }
    }
    catch (err) {
      console.error(err.stack || err);
    }
    finally {
      process.exit(0);
    }

  });

}

fs.mkdir(sumanHome, function (err) {

  if (err && !String(err.stack || err).match(/EEXIST/)) {
    console.error(' => Suman cannot complete its normal postinstall routine, ' +
      'but it\'s not a big deal =>\n', err.stack || err);
    runDatabaseInstalls(err);
    return;
  }

  async.parallel([

    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      const dbDir = path.resolve(sumanHome + '/database');
      fs.mkdir(dbDir, function (err) {
        cb((err && !String(err).match(/EEXIST/)) ? err : null);
      });
    },

    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      const globalDir = path.resolve(sumanHome + '/global');
      fs.mkdir(globalDir, function (err) {
        cb(err && !String(err).match(/EEXIST/) ? err : null);
      });
    },

    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      fs.readFile(require.resolve('./suman-clis.sh'), function (err, data) {
        if (err) {
          cb(err);
        }
        else {
          fs.writeFile(sumanClis, data, {mode: 0o777}, cb);
        }
      });

    },
    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      fs.readFile(require.resolve('./suman-completion.sh'), function (err, data) {
        if (err) {
          cb(err);
        }
        else {
          fs.writeFile(sumanCompletion, data, {mode: 0o777}, cb);
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
          fs.writeFile(findSumanExec, data, {mode: 0o777}, cb);
        }
      });

    },
    function (cb) {
      fs.writeFile(sumanDebugLog, '\n\n => Suman post-install script run on ' + new Date()
        + ', from directory (cwd) => ' + cwd, {mode: 0o777}, cb);
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
          fs.writeFile(findProjectRootDest, data, {mode: 0o777}, cb);
        }
      });
    }

  ], function (err) {

    runDatabaseInstalls(err);

  });

});
