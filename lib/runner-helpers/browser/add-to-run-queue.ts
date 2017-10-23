'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IGanttData} from "../socket-cp-hash";
import {IRunnerRunFn, ISumanChildProcess} from "suman-types/dts/runner";
import {AsyncQueue} from "async";
import {ChildProcess} from 'child_process';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');
import cp = require('child_process');

//npm
import async = require('async');
import chalk = require('chalk');
import semver = require('semver');
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getTapParser} from '../handle-tap';
import {getTapJSONParser} from '../handle-tap-json';
import pt from 'prepend-transform';
import uuidV4 = require('uuid/v4');
import {findPathOfRunDotSh} from '../runner-utils'
import {constants} from "../../../config/suman-constants";
const runChildPath = require.resolve(__dirname + '/../run-child.js');

//////////////////////////////////////////////////////////////////////

export const makeAddToRunQueue = function (runnerObj: Object, args: Array<string>, runQueue: AsyncQueue<Function>,
                                           projectRoot: string, cpHash: Object, forkedCPs: Array<any>,
                                           onExitFn: Function) {

  const {sumanOpts, sumanConfig, maxProcs} = _suman;
  const isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
  const isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
  const debugChildren = sumanOpts.debug_child || sumanOpts.inspect_child;
  const inheritRunStdio = debugChildren || sumanOpts.inherit_stdio ||
    sumanOpts.inherit_all_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes';
  let childId = 1;

  const cl = require('chrome-launcher');

  const sumanEnv = Object.assign({}, process.env, {
    SUMAN_RUN_CHILD_STATIC_PATH: runChildPath,
    SUMAN_CONFIG: JSON.stringify(sumanConfig),
    SUMAN_OPTS: JSON.stringify(sumanOpts),
    SUMAN_RUNNER: 'yes',
    SUMAN_PROJECT_ROOT: projectRoot,
    SUMAN_RUN_ID: _suman.runId,
    SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
    NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes'),
    SUMAN_SOCKETIO_SERVER_PORT: _suman.socketServerPort > 0 ? _suman.socketServerPort : undefined
  });

  const port = _suman.socketServerPort;

  return function (file: string, shortFile: string, stdout: string, gd: IGanttData) {

    runQueue.push(function (cb: Function) {

      if (runnerObj.bailed) {
        // should not fork any more child processes if we have bailed
        if (sumanOpts.verbosity > 4)
          _suman.log('"--bailed" option was passed and was tripped, no more child processes will be forked.');
        return;
      }

      const argz = JSON.parse(JSON.stringify(args));

      let n: ISumanChildProcess, hashbang = false;

      const extname = path.extname(shortFile);

      let $childId = childId++;
      let childUuid = uuidV4();
      const inherit = _suman.$forceInheritStdio ? 'inherit' : '';

      if (inherit) {
        _suman.log('we are inheriting stdio of child, because of sumanception.');
      }

      const testData = JSON.stringify({
         path: file
      });


      cl.launch({
        startingUrl: `http://localhost:${port}/suman_testing?data=${testData}`,
        chromeFlags: []
        // chromeFlags: ['--headless', '--disable-gpu']
      })
      .then(c => {

        const n = c.instance.chrome;

        console.log(`Chrome debugging port running on ${n.port}`);

        cpHash[$childId] = n;

        if (!_suman.weAreDebugging) {
          n.to = setTimeout(function () {
            _suman.logError(`Suman killed a child process because it timed out: '${n.fileName || n.filename}'.`);
            n.kill('SIGINT');
            setTimeout(function () {
              // note that we wait 8 seconds for the child process to clean up before sending it a SIGKILL signal
              n.kill('SIGKILL');
            }, 8000);
          }, constants.DEFAULT_CHILD_PROCESS_TIMEOUT);
        }

        n.testPath = file;
        n.shortTestPath = shortFile;
        forkedCPs.push(n);

        n.on('message', function (msg) {
          _suman.logError('Warning - Suman browser runner does not handle standard Node.js IPC messages.');
        });

        n.on('error', function (err) {
          _suman.logError('error spawning child process => ', err.stack || err);
          if (hashbang) {
            console.error('\n');
            console.error(' => The supposed test script file with the following path may not have a hashbang => ');
            console.error(chalk.magenta.bold(file));
            console.error(' => A hashbang is necessary for non-.js files and when there is no accompanying @run.sh file.');
            console.error(' => Without a hashbang, Suman (and your OS) will not know how to run the file.');
            console.error(' => See sumanjs.org for more information.');
          }
        });

        if (n.stdio && n.stdout && n.stderr) {

          if (inherit) {
            _suman.logError('n.stdio is defined even though we are in sumanception territory.');
          }

          n.stdout.setEncoding('utf8');
          n.stderr.setEncoding('utf8');

          if (inheritRunStdio) {

            let onError = function (e: Error) {
              _suman.logError('\n', su.getCleanErrorString(e), '\n');
            };

            n.stdout.pipe(pt(chalk.cyan(' [suman child stdout] ')))
            .once('error', onError).pipe(process.stdout);
            n.stderr.pipe(pt(chalk.red.bold(' [suman child stderr] '), {omitWhitespace: true}))
            .once('error', onError).pipe(process.stderr);
          }

          n.stdio[2].setEncoding('utf-8');
          n.stdio[2].on('data', function (data) {

            const d = String(data).split('\n').filter(function (line) {
              return String(line).length;
            })
            .map(function (line) {
              return '[' + n.shortTestPath + '] ' + line;
            })
            .join('\n');

            _suman.sumanStderrStream.write('\n' + d);

            if (_suman.weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
              //TODO: go through code and make sure that no console.log statements should in fact be console.error
              console.log('pid => ', n.pid, 'stderr => ', d);
            }
          });

        }
        else {
          if (su.vgt(2)) {
            _suman.logWarning('Stdio object not available for child process.');
          }
        }

        _suman.log(chalk.black('File has just started running =>'), chalk.grey.bold(`'${file}'.`));
        n.dateStartedMillis = gd.startDate = Date.now();
        n.once('exit', onExitFn(n, gd, cb));

      });

    });
  }

};
