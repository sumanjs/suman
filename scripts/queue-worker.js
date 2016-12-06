'use striiiict';

//core
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const util = require('util');

//npm
const lockFile = require('lockfile');
const debug = require('suman-debug');

///////////////////////////////////////////////////////////////

const sumanHome = path.resolve(process.env.HOME + '/.suman');
const queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');
const lock = path.resolve(process.env.HOME + '/.suman/install-queue.lock');
const debugPostinstall = debug('s:postinstall');

//////////////////////////////////////////////////////////////

// const installOptionalDeps = require('./install-optional-deps');

//////////////////////////////////////////////////////////////

const debugLog = path.resolve(sumanHome + '/suman-debug.log');


//200 second timeout...
setTimeout(function () {
    console.error(' => Suman postinstall queue worker timed out.');
    process.exit(1);
}, 200000);


const fd = fs.openSync(debugLog, 'a');

///////////////////////////////////////////////////////////////

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

function unlock(cb) {
    lockFile.unlock(lock, function (err) {
        if (err) {
            console.error(err.stack || err);
        }

        cb && cb();
    });
}

module.exports = function work(cb) {

    lockFile.lock(lock, {}, function (err) {

        if (err) {
            return unlock(cb);
        }

        fs.readFile(queue, 'utf8', function (err, data) {
            if (err) {
                console.error(err);
                unlock(cb);
            }
            else {

                const lines = String(data).split('\n').filter(function(l){
                    return String(l).trim().length;
                });

                const first = String(lines[0] || '').trim();

                // console.log(' => lines => ', util.inspect(lines));

                console.log(' => number of lines => ', lines.length);

                if (!first) {
                    console.log(' => Install queue is empty, we are done here.');
                    unlock(cb);

                }
                else {

                    const d = lines.filter(function (l) {
                        // remove the first line, and any duplicate lines in the queue
                        return String(l).trim() !== String(first).trim();
                    }).join('\n');


                    fs.writeFile(queue, d, {}, function (err) {

                        if (err) {
                            console.error(err.stack || err);
                        }

                        unlock();

                        const args = String(first).split(/\s+/g);

                        const n = cp.spawn(args[0], args.splice(1), {
                            cwd: sumanHome,
                            stdio: ['ignore', fd, fd]
                        });

                        n.on('close', function () {
                            work();
                            // cp.spawn('node', [__filename]);
                        });

                    });

                }

            }

        });


    });

};


