#!/usr/bin/env node


console.log(' => In Suman postinstall script => ', __filename);

//core
const path = require('path');
const fs = require('fs');

//npm
const async = require('async');

//project
const sumanUtils = require('suman-utils/utils');

//cwd
const cwd = process.cwd();

///////////////////////////////////////////////////////////////////////////

const userHomeDir = path.resolve(sumanUtils.getHomeDir());
const p = path.resolve(userHomeDir + '/.suman');
const findSumanExec = path.resolve(p + '/find-local-suman-executable.js');
const sumanClis = path.resolve(p + '/suman-clis.sh');
const sumanDebugLog = path.resolve(p + '/suman-debug.log');

const sumanClisFile = fs.readFileSync(require.resolve('./suman-clis.sh'));
const findSumanExecFile = fs.readFileSync(require.resolve('./find-local-suman-executable.js'));

fs.mkdir(p, function (err) {

  if (err) {
    if (!String(err.stack || err).match(/EEXIST: file already exists/)) {
      throw err;
    }
  }

  async.parallel([

    function a(cb) {
      //always want to update this file to the latest version, so always overwrite
      fs.writeFile(sumanClis, sumanClisFile, { flag: 'w' }, cb);
    },
    function a(cb) {
      //always want to update this file to the latest version, so always overwrite
      fs.writeFile(findSumanExec, findSumanExecFile, { flag: 'w' }, cb);
    },
    function b(cb) {
      fs.writeFile(sumanDebugLog, '\n\n => Suman post-install script run on ' + new Date()
        +', from directory (cwd) => ' + cwd, { flag: 'a' }, cb);
    }

  ], function (err) {

    if (err) {
      fs.writeFileSync(sumanDebugLog, '\n => Suman post-install script failed with error => \n' + (err.stack || err), { flag: 'a' });
      throw err;
    }
    else {
      fs.writeFileSync(sumanDebugLog, '\n => Suman post-install script succeeded', { flag: 'a' });
      process.exit(0);
    }

  })

});