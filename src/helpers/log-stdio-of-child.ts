'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const fs = require('fs');

//npm
const replaceStrm = require('replacestream');
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';

////////////////////////////////////////////////////////////////////////////////

let callable = true;

export const run = function (filePath: string) {

  if (!callable) {
    return;
  }

  callable = false;

  if (process.env.MAKE_SUMAN_LOG !== 'no') {

    if (su.vgt(6)) {
      _suman.log.info('we are logging child stdout/stderr to files.', '\n');
    }

    const timestamp = process.env.SUMAN_RUNNER_TIMESTAMP;
    const runId = process.env.SUMAN_RUN_ID;
    const logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
    const sumanCPLogs = path.resolve(logsDir + '/runs/');
    const f = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);

    if (SUMAN_SINGLE_PROCESS) {
      _suman.log.error('\n');
      _suman.log.error('in SUMAN_SINGLE_PROCESS mode, and we are not currently configured to log stdio to log file.');
      _suman.log.error('\n');
      return;
    }

    let isDeleteFile = true, writeToFileStream = true;
    const temp = su.removePath(filePath, _suman.projectRoot);
    const onlyFile = String(temp).replace(/\//g, '.');
    const logfile = path.resolve(f + '/' + onlyFile + '.log');

    // replace control chars with empty string, \d is equivalent to [0-9]
    const rstrm = replaceStrm(/\[\d{1,2}(;\d{1,2})?m/g, '');
    const strm = rstrm.pipe(fs.createWriteStream(logfile));

    strm.on('error', function (e: Error) {
      _suman.log.error(e.stack || e);
    });

    _suman.endLogStream = function () {
      // _suman.log.error('endLogStream finished.');
      // rstrm.unpipe();
      writeToFileStream = false;
      strm.end('this is the end of the Suman test stream.\n');
    };

    strm.on('drain', function () {
      _suman.isStrmDrained = true;
      _suman.drainCallback && _suman.drainCallback(logfile);
    });

    if (true || _suman.sumanConfig.isLogChildStderr) {
      const stderrWrite = process.stderr.write;
      process.stderr.write = function () {
        _suman.isStrmDrained = false;
        isDeleteFile = false;
        // if (writeToFileStream) {
        //   try {
        //     strm.write.apply(strm, arguments);
        //   }
        //   catch (e) {
        //     _suman.log.error(e.stack || e);
        //   }
        // }

        if (writeToFileStream) {
          strm.write.apply(strm, arguments);
        }

        stderrWrite.apply(process.stderr, arguments);
      };
    }

    fs.appendFileSync(logfile, ' => Beginning of debug log for test with full path => \n' + filePath + '\n');

    if (true || _suman.sumanConfig.isLogChildStdout) {
      const stdoutWrite = process.stdout.write;
      process.stdout.write = function () {
        _suman.isStrmDrained = false;
        isDeleteFile = false;
        if (writeToFileStream) {
          strm.write.apply(strm, arguments);
        }
        stdoutWrite.apply(process.stdout, arguments);
      };
    }

    process.once('exit', function () {
      // we only delete files for which no stderr was written to them
      // the reason we delete empty log files, is because there is no reason for the user to see them
      if (isDeleteFile && false) {
        try {
          fs.unlinkSync(logfile);
        }
        catch (err) {
          _suman.log.error(' => Could not unlink extraneous log file at path => ', logfile);
        }
      }
      else {
        // fs.appendFileSync(logfile, '\n => This is the end of the test.');
      }
    });
  }

};
