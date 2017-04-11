'use strict';

//core
const path = require('path');
const fs = require('fs');

//npm
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');

////////////////////////////////////////////////////////////////////////////////

let callable = true;

module.exports = function (filePath) {

  if (!callable) {
    return;
  }

  callable = false;
  const timestamp = process.env.SUMAN_RUNNER_TIMESTAMP;
  const runId = process.env.SUMAN_RUN_ID;

  if (process.env.MAKE_SUMAN_LOG !== 'no') {

    const f = path.resolve(_suman.sumanHelperDirRoot + '/logs/runs/' + timestamp + '-' + runId);

    if (process.env.SUMAN_SINGLE_PROCESS) {
      console.error('\n',
        ' => Suman is in SINGLE_PROCESS_MODE and is not currently configured to log stdio to log file.', '\n');
    }
    else {

      const temp = su.removePath(filePath, _suman.projectRoot);
      const onlyFile = String(temp).replace(/\//g, '.');
      const logfile = path.resolve(f + '/' + onlyFile + '.log');

      fs.writeFileSync(logfile, '');
      const stderrWrite = process.stderr.write;

      let isDeleteFile = true;
      process.stderr.write = function () {
        isDeleteFile = false;
        stderrWrite.apply(process.stderr, arguments);
        fs.appendFileSync(logfile, '\n');
        fs.appendFileSync(logfile,  String(arguments[0]).replace(/\[[0-9][0-9]m/g, ''));
      };

      fs.appendFileSync(logfile, ' => Beginning of stderr log for test with full path => \n'
        + filePath + '\n');

      if (true || sumanConfig.isLogChildStdout) {
        const stdoutWrite = process.stdout.write;
        process.stdout.write = function () {
          isDeleteFile = false;
          stdoutWrite.apply(process.stdout, arguments);
          fs.appendFileSync(logfile, '\n');
          // below: replace control characters with empty string
          fs.appendFileSync(logfile, String(arguments[0]).replace(/\[[0-9][0-9]m/g, ''));
        };
      }


      process.once('exit', function () {
        // we only delete files for which no stderr was written to them
        // the reason we delete empty log files, is because there is no reason for the user to see them
        if (isDeleteFile) {
          try {
            fs.unlinkSync(logfile);
          }
          catch (err) {
            stderrWrite.call(process.stderr, ' => Could not unlink extraneous log file.');
          }
        }
      });
    }

  }
};
