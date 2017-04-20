'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const fs = require('fs');

//npm
const replaceStrm = require('replacestream');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');

////////////////////////////////////////////////////////////////////////////////

let callable = true;

export = function (filePath: string) {

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

      let isDeleteFile = true;

      const temp = su.removePath(filePath, _suman.projectRoot);
      const onlyFile = String(temp).replace(/\//g, '.');
      const logfile = path.resolve(f + '/' + onlyFile + '.log');


      const strm = replaceStrm(/\[[0-9][0-9]m/g, '').pipe(fs.createWriteStream(logfile));

      strm.on('drain', function () {
        _suman.isStrmDrained = true;
        if (_suman.drainCallback) {
          console.log(' => DDDDDDDDDDRAIN.');
          _suman.drainCallback(logfile);
        }
      });

      process.stderr.on('drain', function () {
        _suman.isStrmDrained = true;
        if (_suman.drainCallback) {
          console.log(' => DDDDDDDDDDRAIN.');
          _suman.drainCallback(logfile);
        }
      });

      // RM fs.writeFileSync(logfile, '');

      if (_suman.sumanConfig.isLogChildStderr) {
        const stderrWrite = process.stderr.write;
        process.stderr.write = function () {
          _suman.isStrmDrained = false;
          isDeleteFile = false;
          strm.write.apply(strm, arguments);
          stderrWrite.apply(process.stderr, arguments);
          // RM fs.appendFileSync(logfile, '\n');
          // below: replace control characters with empty string
          // RM fs.appendFileSync(logfile, String(arguments[0]).replace(/\[[0-9][0-9]m/g, ''));
        };
      }

      fs.appendFileSync(logfile, ' => Beginning of stderr log for test with full path => \n'
        + filePath + '\n');

      if (_suman.sumanConfig.isLogChildStdout) {
        const stdoutWrite = process.stdout.write;
        process.stdout.write = function () {
          _suman.isStrmDrained = false;
          isDeleteFile = false;
          strm.write.apply(strm, arguments);
          stdoutWrite.apply(process.stdout, arguments);
          // RM fs.appendFileSync(logfile, '\n');
          // below: replace control characters with empty string
          // RM fs.appendFileSync(logfile, String(arguments[0]).replace(/\[[0-9][0-9]m/g, ''));
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
            console.error(' => Could not unlink extraneous log file at path => ', logfile);
          }
        }
        else {
          fs.appendFileSync(logfile, ' => This is the end of the test.');
        }
      });
    }

  }
};
