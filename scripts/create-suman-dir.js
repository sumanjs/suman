#!/usr/bin/env node

//core
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

//npm
//
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
      fs.readFile(require.resolve('./suman-clis.sh'), function (err, data) {
        if (err) {
          cb(err);
        }
        else {
          fs.writeFile(sumanClis, data, {flag: 'w', flags: 'w'}, cb);
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
          fs.writeFile(findSumanExec, data, {flag: 'w', flags: 'w'}, cb);
        }
      });

    },
    function (cb) {
      fs.writeFile(sumanDebugLog, '\n\n => Suman post-install script run on ' + new Date()
        + ', from directory (cwd) => ' + cwd, {flag: 'a', flags:'a'}, cb);
    },
    function (cb) {
      // assume we want to create the file if it doesn't exist, and just write empty string
      fs.appendFile(queue, '', cb);
    },
    function (cb) {
      fs.readFile(require.resolve('./find-project-root.js'), function (err, data) {
        if (err) {
          cb(err);
        }
        else {
          fs.writeFile(findProjectRootDest, data, {flag: 'w', flags: 'w'}, cb);
        }
      });

    }

  ], function (err) {

    if (err) {
      try{
        fs.appendFileSync(sumanDebugLog, '\n => Suman post-install script failed with error => \n' + (err.stack || err));
      }
      catch(err){
        //ignore
      }
      console.error(err.stack || err);
      process.exit(1);
    }
    else {

      if (fs.existsSync(sumanHome)) {
        debug(' => ~/.suman dir exists!');
        process.exit(0);
      }
      else {
        debug(' => Warning => ~/.suman dir does not exist!');
        process.exit(1)
      }

    }

  })

});
