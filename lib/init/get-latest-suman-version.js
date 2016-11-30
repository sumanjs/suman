'use striiict';

//core
const cp = require('child_process');
const os = require('os');
const path = require('path');

//npm
const colors = require('colors/safe');

/////////////////////////////////////////////////////////////////////////////

module.exports = function (data) {

  const pkgDotJSON = data.pkgDotJSON;
  const projectRoot = data.projectRoot;

  return function getLatestSumanVersion (cb) {

    cp.exec('npm view suman version', function (err, stdout, stderr) {
      if (err || String(stdout).match(/error/i) || String(stderr).match(/error/)) {
        cb(err || stdout || stderr);
      }
      else {
        console.log('\n\n', colors.cyan(' => Newest Suman version in the NPM registry:'), String(stdout).replace('\n', ''));
        if (pkgDotJSON) {
          console.log(colors.cyan(' => Locally installed Suman version:'), pkgDotJSON.version);
        }

        cb(null);
      }
    });

  }

};


