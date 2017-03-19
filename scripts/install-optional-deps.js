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
const constants = require('../config/suman-constants');
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
const bd = process.env.BASE_DIRECTORY;

console.log('BASE_DIRECTORY in JavaScript is => ', bd);
const dirs = ['HOME', 'USERS'];

const nvm = path.resolve(String(process.env.NPM_GLOBAL_ROOT).trim());
console.log('BASE_DIRECTORY in JavaScript is => ', bd);

//if base directory is not home or users, then we are installing globally, so always install all
//TODO: regarding above, but what about NVM?
var alwaysInstallDueToGlobal = dirs.indexOf(String(bd).trim().toUpperCase().replace('/', '')) < 0;


console.log(' => cwd in postinstall script =>', cwd);
const projectRoot = residence.findProjectRoot(cwd);
console.log(' => Project root => ', projectRoot);

// semver.gt('1.2.3', '9.8.7') // false

var pkgDotJSON;
var pth = path.resolve(projectRoot + '/package.json');

try {
  pkgDotJSON = require(pth);
}
catch (err) {
  console.error('\n', ' => Suman postinstall warning => \n',
    'Could not find package.json located here => ', pth, '\n');
}

var sumanConf = {};
var alwaysInstall = false;

try {
  sumanConf = require(path.resolve(projectRoot + '/suman.conf.js'));
}
catch (err) {
  // if there is no suman.conf.js file, we install all deps, and we do it as a daemon
  alwaysInstall = true;
}

//always install latest for now
var installs = [];

installs = installs.concat(Object.keys(deps.slack));
installs = installs.concat(Object.keys(deps.sqlite3));
installs = installs.concat(Object.keys(deps.sumanSqliteReporter));

if (sumanConf.transpile !== false && ( alwaysInstall || alwaysInstallDueToGlobal)) {
  installs = installs.concat(Object.keys(deps.babel));
}

if (sumanConf.useSumanServer || alwaysInstall || alwaysInstallDueToGlobal) {
  installs = installs.concat(Object.keys(deps.sumanServer));
}

if (sumanConf.useSumanInteractive || alwaysInstall || alwaysInstallDueToGlobal) {
  installs = installs.concat(Object.keys(deps.sumanInteractive));
}

if (sumanConf.useIstanbul || alwaysInstall || alwaysInstallDueToGlobal) {
  installs = installs.concat(Object.keys(deps.istanbul));
}

if (sumanConf.useIstanbul || alwaysInstall || alwaysInstallDueToGlobal) {
  installs = installs.concat(Object.keys(deps.typescript));
}

//200 second timeout...
const to = setTimeout(function () {
  console.error(' => Suman postinstall process timed out.');
  process.exit(1);
}, 2000000);

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

async.map(installs, function (item, cb) {

  const p = path.resolve(sumanHome + '/node_modules/', item);

  async.parallel({
    view: function (cb) {
      cp.exec('npm view ' + item + ' version', function (err, val) {
        if (err) {
          // npm might not be installed globally, what to do then?
          console.error('\n',err.stack || err,'\n');
           cb(null, {});
        }
        else{
          cb(null, {
            name: item,
            version: String(val).replace(/\s/g, '')
          });
        }

      });
    },
    stats: function (cb) {

      const pkg = path.resolve(p + '/package.json');

      fs.readFile(pkg, 'utf8', function (err, data) {
        if (err) {
          cb(null, {version: null});
        }
        else {
          ijson.parse(data).then(function (v) {
            if (!v || !v.version) {
              console.log(' => NPM version is not defined for item => ' + item);
            }
            cb(null, {
              version: v && v.version
            })
          }, cb);

        }
      });

    }
  }, function (err, results) {
    if (err) {
      return cb(err);
    }

    console.log(' item => ' + item, 'view version:'
    + results.view.version, 'stats version:' + results.stats.version);

    if (!results.stats.version) {
      results.view.action = 'install';
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

  var runWorker = false;
  const linesToAdd = [];

  results.forEach(function (result) {

    const item = result.name;
    const action = result.action;

    var args;

    switch (action) {
      case 'do-nothing':
        // local version is up-to-date with latest in npm registry
        return;
      case 'install':
        console.log(' => Installing => ', item, ' at path => ', sumanHome,'\n');
        args = ['npm', 'install', item + '@latest', '--only=production', '--force', '--loglevel=error', '--silent', '--progress=false'];
        break;
      case 'update':
        console.log(' => Updating => ', item, ' at path => ', sumanHome,'\n');
        args = ['npm', 'update', item + '@latest', '--only=production', '--loglevel=error', '--silent', '--progress=false'];
        break;
      default:
        throw new Error(' => Switch statement fallthrough.');

    }

    args = args.join(' ').trim();
    linesToAdd.push(args);
    runWorker = true;

  });

  /*

   opts.wait
   A number of milliseconds to wait for locks to expire before giving up.
   Only used by lockFile.lock. Poll for opts.wait ms. If the lock is not cleared by the time the wait expires,
   then it returns with the original error.

   opts.pollPeriod
   When using opts.wait, this is the period in ms in which it polls to check if the lock has expired.
   Defaults to 100.

   opts.stale
   A number of milliseconds before locks are considered to have expired.

   opts.retries
   Used by lock and lockSync. Retry n number of times before giving up.

   opts.retryWait
   Used by lock. Wait n milliseconds before retrying.

   */

  if (!runWorker) {
    console.log(' => Did not need to run postinsall queue worker because no items matched.');
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
        var lines = String(data).split('\n');
        lines = lines.concat(linesToAdd);
        lines = lines.filter(function (l) {
          // trim removes newline characters from beginning and end of strings
          return String(l).trim().length > 0;
        });
        fs.writeFile(queue, lines.join('\n'), {mode:0o777}, function ($err) {
          lf.unlock(installQueueLock, function (err) {
            run($err || err);
          });
        });

      }
    });

  });

  function run (err) {

    if (err) {
      console.error(err.stack || err);
      return process.exit(1);
    }

    function makeWorker () {
      queueWorker(function () {
        console.log(' => Done with queue-worker, now unlocking queueWorkerLock...');
        fs.unlink(queueWorkerLock, function () {
          clearTimeout(to);
          console.log(' => Total suman postinstall optional deps time => ', String(Date.now() - time));
          process.exit(0);
        });
      });
    }

    fs.writeFile(queueWorkerLock, String(new Date()), {flag: 'wx', mode:0o777}, function (err) {

      if (err && !String(err.stack || err).match(/EEXIST/i)) {
        console.error(err.stack || err);
        return process.exit(1);
      }
      else if (err) {
        // file already EXISTS, so let's see if it's stale being reading the date in it
        fs.readFile(queueWorkerLock, function (err, data) {
          if (err) {
            //ignore err
            console.error('\n',err.stack || err,'\n');
          }
          if (data) {
            const now = new Date();
            const then = new Date(String(data).trim());
            console.log(' => Existing date in lock file =>',then);
            if (now - then > 300000) {
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

