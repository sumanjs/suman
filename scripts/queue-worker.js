'use striiiict';

//core
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const util = require('util');

//npm
const lockFile = require('lockfile');
const colors = require('colors/safe');

///////////////////////////////////////////////////////////////

const sumanHome = path.resolve(process.env.HOME + '/.suman');
const globalDir = path.resolve(sumanHome + '/global');
const queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');
const lock = path.resolve(process.env.HOME + '/.suman/install-queue.lock');
const debug = require('suman-debug')('s:postinstall');

//////////////////////////////////////////////////////////////

// const installOptionalDeps = require('./install-optional-deps');

//////////////////////////////////////////////////////////////

const debugLog = path.resolve(sumanHome + '/suman-debug.log');

///////////////////////////////////////////////////////////////

function unlock (cb) {
  lockFile.unlock(lock, function (err) {
    if (err) {
      console.error('\n', err.stack || err, '\n');
    }

    cb && cb();
  });
}

const obj = {
  stale: 18000,
  wait: 20000,
  pollPeriod: 110,
  retries: 300,
  retryWait: 150
};

//////////////////////////////////////////////////////////////////

module.exports = function work (cb) {

  lockFile.lock(lock, obj, function (err) {

    if (err) {
      return unlock(cb);
    }

    fs.readFile(queue, 'utf8', function (err, data) {
      if (err) {
        console.error(err);
        unlock(cb);
      }
      else {

        const lines = String(data).split('\n').filter(function (l) {
          // filter out empty lines
          return String(l).trim().length > 0;
        });

        const first = String(lines[0] || '').trim();

        if (!first) {
          console.log(' => Install queue is empty, we are done here.');
          unlock(cb);
        }
        else {

          console.log(' => Line / command to be run next => ', first);
          console.log(' => number of npm install lines remaining before de-duping => ', lines.length,'\n');

          const d = lines.filter(function (l) {
            // remove the first line, and any duplicate lines in the queue
            return String(l).trim() !== String(first).trim();
          }).map(function (l) {
            return String(l).trim();
          });

          // filter out any non-unique values
          const uniqueList = d.filter(function (elem, pos, arr) {
            if (arr.indexOf(elem) === pos) {
              return true;
            }
            else {
              console.log(' => Suman postinstall message => Filtering out the following duplicate item from queue => \n',
                colors.magenta(elem),'\n');
            }
          });

          data = uniqueList.join('\n');

          console.log(' => Suman postinstall message => number of npm install lines remaining *after* de-duping => ', uniqueList.length,
            '\n', ' first item => ', first,'\n');

          fs.writeFile(queue, data, {}, function (err) {

            if (err) {
              console.error('\n', err.stack || err, '\n');
            }

            unlock();

            const n = cp.spawn('bash', [], {
              cwd: globalDir
            });

            n.stdin.write('\n' + first + '\n');

            process.nextTick(function () {
              n.stdin.end();
            });

            n.on('close', function () {
              work(cb);
            });

          });

        }
      }
    });

  });

};


