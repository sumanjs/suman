#!/usr/bin/env node
'use strict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const assert = require('assert');
const util = require('util');

//npm
const colors = require('colors/safe');
const lf = require('lockfile');
const async = require('async');
const semver = require('semver');
const ijson = require('siamese');
const queueWorkerLock = path.resolve(process.env.HOME + '/.suman/queue-worker.lock');
const installQueueLock = path.resolve(process.env.HOME + '/.suman/install-queue.lock');
const queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');

//project
const {constants} = require('../config/suman-constants');
const sumanHome = path.resolve(process.env.HOME + '/.suman');
const sumanUtils = require('suman-utils');
const residence = require('residence');
const queueWorker = require('./queue-worker');
const debugLog = path.resolve(sumanHome + '/suman-debug.log');

///////////////////////////////////////////////////////////////////////////////////////////

const cwd = process.cwd();
const debug = require('suman-debug')('s:postinstall', {
  fg: 'cyan'
});

///////////////////////////////////////////////////////////////////////////////////////////

const deps = Object.freeze(constants.SUMAN_GLOBAL_DEPS);
const bd = process.env['SUMAN_BASE_DIRECTORY'];

console.log('BASE_DIRECTORY in JavaScript is => ', bd);
const dirs = ['HOME', 'USERS'];

const nvm = path.resolve(String(process.env['SUMAN_NPM_GLOBAL_ROOT']).trim());
console.log('SUMAN_BASE_DIRECTORY in JavaScript is => ', bd);

//if base directory is not home or users, then we are installing globally, so always install all
//TODO: regarding above, but what about NVM?
let alwaysInstallDueToGlobal = dirs.indexOf(String(bd).trim().toUpperCase().replace('/', '')) < 0;

console.log(' => cwd in postinstall script =>', cwd);
const projectRoot = global.projectRoot = residence.findProjectRoot(cwd);
console.log(' => Project root => ', projectRoot);

let pkgDotJSON;
let pth = path.resolve(projectRoot + '/package.json');

try {
  pkgDotJSON = require(pth);
}
catch (err) {
  console.error('\n', ' => Suman postinstall warning => \n',
    'Could not find package.json located here => ', pth, '\n');
}

let sumanConf = {};
let alwaysInstall = false;

try {
  sumanConf = require(path.resolve(projectRoot + '/suman.conf.js'));
}
catch (err) {
  // if there is no suman.conf.js file, we install all deps, and we do it as a daemon
  alwaysInstall = true;
}

if (sumanConf.installSumanExtraDeps === false) {
  console.error(' => We will not install any suman "global" modules, because "installSumanExtraDeps" is false.');
  process.exit(0);
}

//always install latest for now
let installs = [];
installs = installs.concat(Object.keys(deps.sqlite3));
installs = installs.concat(Object.keys(deps.sumanSqliteReporter));

if (true || sumanConf['useSumanWatch']) {
  //remove true later
  installs = installs.concat(Object.keys(deps.sumanW));
}

if (true || sumanConf['useSumanD']) {
  // remove true later
  installs = installs.concat(Object.keys(deps.sumanD));
}

if (sumanConf['useSumanInteractive'] || alwaysInstall || alwaysInstallDueToGlobal) {
  installs = installs.concat(Object.keys(deps.sumanInteractive));
}

if (sumanConf['useIstanbul'] || alwaysInstall || alwaysInstallDueToGlobal) {
  installs = installs.concat(Object.keys(deps.istanbul));
}

if (sumanConf['useTypeScript'] && (alwaysInstall || alwaysInstallDueToGlobal)) {
  installs = installs.concat(Object.keys(deps.typescript));
}

if (sumanConf['useNYC'] && (alwaysInstall || alwaysInstallDueToGlobal)) {
  installs = installs.concat(Object.keys(deps.nyc));
}

if (sumanConf['useBabel'] && (alwaysInstall || alwaysInstallDueToGlobal)) {
  installs = installs.concat(Object.keys(deps.babel));
}

installs = installs.concat(Object.keys(deps.slack));

//2000 second timeout...
let timeout = 2000000;

const to = setTimeout(function () {
  console.error(' => Suman postinstall process timed out.');
  process.exit(1);
}, timeout);

//////////////////////////////////////////////////////

console.log('=> Installs =>', installs);
const time = Date.now();

const lockfileOptionsObj = {
  stale: 19000,
  wait: 20000,
  pollPeriod: 110,
  retries: 3000,
  retryWait: 150
};

let canInstallSumanGlobal = global.canInstallSumanGlobal = true;

try {
  fs.existsSync(process.env.HOME + '/.suman/global');
}
catch (err) {
  canInstallSumanGlobal = global.canInstallSumanGlobal = false;
}

async.map(installs, function (item, cb) {

  const p = path.resolve(sumanHome + '/node_modules/', item);

  async.parallel({
    view: function (cb) {

      if (canInstallSumanGlobal) {
        cp.exec('npm view ' + item + ' version', function (err, val) {
          if (err) {
            // npm might not be installed globally, what to do then?
            console.error('\n', err.stack || err, '\n');
            cb(null, {});
          }
          else {
            cb(null, {
              name: item,
              version: String(val).replace(/\s/g, '')
            });
          }
        });
      }
      else {
        process.nextTick(cb, null, {
          name: item,
          version: 'install it because we are installing in node_modules'
        });
      }

    },
    stats: function (cb) {

      if (canInstallSumanGlobal) {
        const pkg = path.resolve(p + '/package.json');

        fs.readFile(pkg, 'utf8', function (err, data) {
          if (err) {
            cb(null, {version: null});
          }
          else {
            ijson.parse(data).then(function (v) {
              if (!v || !v.version) {
                console.log(' => Suman postinstall warning => NPM version is not defined for item => ' + item);
              }
              cb(null, {
                version: v && v.version
              })
            }, cb);

          }
        });

      }
      else {
        process.nextTick(cb, null, {
          name: item,
          version: 'install it because we are installing in node_modules'
        });
      }

    }
  }, function (err, results) {
    if (err) {
      return cb(err);
    }

    if (!results.stats.version) {
      results.view.action = 'install';
    }
    else if (results.view.action === 'install it because we are installing in node_modules') {
      results.view.action = 'install to node_modules';
    }
    else {

      try {
        assert(semver.valid(results.stats.version));
        assert(semver.valid(results.view.version));
      }
      catch (err) {
        results.view.action = 'install';
        return cb(null, results.view);
      }

      // semver.gt('1.2.3', '9.8.7') // false
      if (semver.lt(results.stats.version, results.view.version)) {
        results.view.action = 'update';
      }
      else {
        results.view.action = 'do-nothing';
      }
    }
    //finally we call
    cb(null, results.view);
  });

}, function (err, results) {

  if (err) {
    console.error(err);
    return process.exit(1);
  }

  let runWorker = false;
  const linesToAdd = [];

  results.forEach(function (result) {

    const item = result.name;
    const action = result.action;

    let args;

    switch (action) {
      case 'do-nothing':
        // local version is up-to-date with latest in npm registry
        return;
      case 'install':
        console.log(' => Installing => ', item, ' at path => ', sumanHome, '\n');
        args = ['npm', 'install', item + '@latest', '--only=production', '--force', '--loglevel=warn', '--silent', '--progress=false'];
        break;
      case 'update':
        console.log(' => Updating => ', item, ' at path => ', sumanHome, '\n');
        args = ['npm', 'update', item + '@latest', '--only=production', '--loglevel=warn', '--silent', '--progress=false'];
        break;
      default:
        throw new Error(' => Suman postinstall routine - switch statement fallthrough.');
    }

    args = args.join(' ').trim();
    linesToAdd.push(args);
    runWorker = true;

  });

  if (!runWorker) {
    console.log(' => Suman postinstall => Did not need to run postinsall queue worker because no items matched.');
    return process.exit(0);
  }

  lf.lock(installQueueLock, lockfileOptionsObj, function (err) {

    if (err) {
      return run(err);
    }

    fs.readFile(queue, 'utf8', function (err, data) {
      if (err) {
        lf.unlock(installQueueLock, function () {
          run(err);
        });
      }
      else {
        let lines = String(data).split('\n');
        lines = lines.concat(linesToAdd);
        lines = lines.filter(function (l) {
          // trim removes newline characters from beginning and end of strings
          return String(l).trim().length > 0;
        });
        fs.writeFile(queue, lines.join('\n'), {mode: 0o777}, function ($err) {
          lf.unlock(installQueueLock, function (err) {
            run($err || err);
          });
        });

      }
    });
  });

  function run(err) {

    if (err) {
      console.error(err.stack || err);
      return process.exit(1);
    }

    function makeWorker() {
      queueWorker(function () {
        console.log(' => Done with queue-worker, now unlocking queueWorkerLock...');
        fs.unlink(queueWorkerLock, function () {
          clearTimeout(to);
          console.log(' => Total suman postinstall optional deps time => ', String(Date.now() - time));
          process.exit(0);
        });
      });
    }

    fs.writeFile(queueWorkerLock, String(new Date()), {flag: 'wx', mode: 0o777}, function (err) {

      if (err && !String(err.stack || err).match(/EEXIST/i)) {
        console.error(err.stack || err);
        return process.exit(1);
      }
      else if (err) {
        // file already EXISTS, so let's see if it's stale being reading the date in it
        fs.readFile(queueWorkerLock, function (err, data) {
          if (err) {
            //ignore err
            console.error('\n', err.stack || err, '\n');
          }
          if (data) {
            const now = new Date();
            const then = new Date(String(data).trim());
            console.log(' => Existing date in lock file =>', then);
            if (now - then > 400000) {
              console.log(' => Lock is old, we will unlink and start processing queue.');
              fs.unlink(queueWorkerLock, makeWorker);
            }
            else {
              console.log(' => Lock is still young, we will let the current worker do its thing.');
              process.exit(0);
            }
          }
          else {
            const e = new Error(' => No data returned from readFile call to queueWorkerLock file.');
            console.error('\n', e.stack, '\n');
            return process.exit(1);
          }
        });

      }
      else {
        makeWorker();
      }

    });

  }

});

