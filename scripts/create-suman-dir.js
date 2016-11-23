'use striiiict';

console.log(' => In Suman postinstall script => ', __filename);

//core
const path = require('path');
const fs = require('fs');

//npm
const async = require('async');

//project
const sumanUtils = require('suman-utils/utils');

///////////////////////////////////////////////////////////////////////////

const userHomeDir = path.resolve(sumanUtils.getHomeDir());
const p = path.resolve(userHomeDir + '/.suman');
const findSumanExec = path.resolve(p + '/find-local-suman-executable.js');
const sumanDebugLog = path.resolve(p + '/suman-debug.log');
const fileToWrite = fs.readFileSync(require.resolve('../cli/find-local-suman-executable.js'));

fs.mkdir(p, function (err) {

  if (err) {
    if (!String(err.stack || err).match(/EEXIST: file already exists/)) {
      throw err;
    }
  }

  async.parallel([

    function (cb) {
      //always want to update this file to the latest version, so always overwrite
      fs.writeFile(findSumanExec, fileToWrite, cb);
    },
    function (cb) {
      fs.writeFile(sumanDebugLog, '=> Suman post-install script run on ' + new Date(), { flag: 'a' }, cb);
    }

  ], function (err) {

    if (err) {
      throw err;
    }
    else {
      process.exit(0);
    }

  })

});