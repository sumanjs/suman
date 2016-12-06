//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const assert = require('assert');
const util = require('util');

//npm
const lockfile = require('lockfile');
const async = require('async');
const semver = require('semver');
const ijson = require('siamese');
const debug = require('suman-debug');
const queueWorkerLock = path.resolve(process.env.HOME + '/.suman/queue-worker.lock');
const installQueueLock = path.resolve(process.env.HOME + '/.suman/install-queue.lock');
const queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');

//project
const queueWorker = require('./queue-worker');

///////////////////////////////////////////////////////////////////////////////////////////

const debugPostinstall = debug('s:postinstall');

///////////////////////////////////////////////////////////////////////////////////////////

const deps = Object.freeze({
    'babel': {
        'webpack': 'latest',
        'babel-cli': 'latest',
        'babel-core': 'latest',
        'babel-loader': 'latest',
        'babel-polyfill': 'latest',
        'babel-runtime': 'latest',
        'babel-register': 'latest',
        'babel-plugin-transform-runtime': 'latest',
        'babel-preset-es2015': 'latest',
        'babel-preset-es2016': 'latest',
        'babel-preset-react': 'latest',
        'babel-preset-stage-0': 'latest',
        'babel-preset-stage-1': 'latest',
        'babel-preset-stage-2': 'latest',
        'babel-preset-stage-3': 'latest',
    },
    'sumanServer': {
        'frontail': 'latest',
        'suman-server': 'latest'
    },
    'sumanInteractive': {
        'suman-inquirer': 'latest',
        'suman-inquirer-directory': 'latest',
    },
    'istanbul': {
        'istanbul': 'latest',
    }
});

const bd = process.env.BASE_DIRECTORY;
const dirs = ['HOME', 'USERS'];

//if base directory is not home or users, then we are installing globally, so always install all
const alwaysInstallDueToGlobal = dirs.indexOf(String(bd).trim().toUpperCase().replace(path.sep, '')) < 0;

const cwd = process.cwd();
debugPostinstall(' => cwd in postinstall script =>', cwd);
const projectRoot = path.resolve(cwd + '/../../');
debugPostinstall('project root => ', projectRoot);


// semver.gt('1.2.3', '9.8.7') // false

var pkgDotJSON;
const pth = path.resolve(projectRoot + '/package.json');

try {
    pkgDotJSON = require(pth);
}
catch (err) {
    console.error('\n',
        ' => Suman postinstall warning => \n',
        'Could not find package.json located here => ', pth, '\n');
}

var sumanConf = {};
var alwaysInstall = false;

try {
    require(path.resolve(projectRoot + '/suman.conf.js'));
}
catch (err) {
    // if there is not suman.conf.js file, we install all deps, and we do it as a daemon
    alwaysInstall = true;
}


//always install latest for now
var installs = [];

if (sumanConf.useBabel || alwaysInstall || alwaysInstallDueToGlobal) {
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

const sumanHome = path.resolve(process.env.HOME + '/.suman');
const debugLog = path.resolve(sumanHome + '/suman-debug.log');

//200 second timeout...
const to = setTimeout(function () {
    console.error(' => Suman postinstall process timed out.');
    process.exit(1);
}, 2000000);


debugPostinstall('=> Installs =>', installs);
const fd = fs.openSync(debugLog, 'a');
// const fdstderr =fs.openSync(debugLog, 'a');

const time = Date.now();


async.map(installs, function (item, cb) {

    const p = path.resolve(sumanHome + '/node_modules/', item);

    async.parallel({
        view: function (cb) {
            cp.exec('npm view ' + item + ' version', function (err, val) {
                if (err) {
                    return cb(err);
                }
                cb(null, {
                    name: item,
                    version: String(val).replace(/\s/g, '')
                })
            });
        },
        stats: function (cb) {

            fs.readFile(path.resolve(p + '/package.json'), 'utf8', function (err, data) {
                if (err) {
                    cb(null, {version: null});
                }
                else {
                    ijson.parse(data).then(function (val) {

                        if (!val || !val.version) {
                            console.error(' val is not defined for item => ', item);
                        }
                        cb(null, {
                            version: val.version
                        })
                    }, cb);

                }

            })

        }
    }, function (err, results) {
        if (err) {
            return cb(err);
        }

        debugPostinstall(' item => ', item, 'view version:', results.view.version, 'stats version => ', results.stats.version, '\n\n\n');

        if (!results.stats.version) {
            results.view.action = 'install';
        }
        else {
            // semver.gt('1.2.3', '9.8.7') // false

            try {
                assert(semver.valid(results.stats.version));
                assert(semver.valid(results.view.version));

            }
            catch (err) {
                console.error(err.stack || err);
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

    async.eachSeries(results, function (result, cb) {

        debugPostinstall(' result => ', util.inspect(result));
        const item = result.name;
        const action = result.action;

        var args;

        switch (action) {
            case 'do-nothing':
                // local version is up-to-date with latest in npm registry
                return process.nextTick(cb);
            case 'install':
                console.log(' => Installing => ', item, ' at path => ', sumanHome);
                args = ['npm', 'install', item + '@latest', '--force', '--loglevel=error', '--silent', '--progress=false'];
                break;
            case 'update':
                console.log(' => Updating => ', item, ' at path => ', sumanHome);
                args = ['npm', 'update', item + '@latest', '--loglevel=error', '--silent', '--progress=false'];
                break;
            default:
                return process.nextTick(function () {
                    cb(new Error(' => Switch statement fallthrough.'));
                });
        }

        args = args.join(' ').trim();

        runWorker = true;

        lockfile.lock(installQueueLock, function (err) {

            if (err) {
                return cb(err);
            }

            fs.readFile(queue, 'utf8', function (err, data) {
                if (err) {
                    cb(err);
                }
                else {
                    const lines = String(data).split('\n');
                    lines.push(args);
                    fs.writeFile(queue, lines.join('\n'), function ($err) {
                        lockfile.unlock(installQueueLock, function (err) {
                            cb($err || err);
                        });
                    });

                }
            });

        });


        // const n = cp.spawn('npm', args, {
        //     cwd: sumanHome,
        //     stdio: ['ignore', fd, fd]
        // });
        //
        // n.on('close', cb);

    }, function (err) {

        if (err) {
            console.error(err.stack || err);
            return process.exit(1);
        }

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
            return process.exit(0);
        }

        lockfile.lock(queueWorkerLock, {

            wait: 10000,
            stale: 500000,
            retries: 40000,
            retryWait: 100

        }, function (err) {

            if (err) {
                console.error(err.stack || err);
                return process.exit(1);
            }
            else {
                queueWorker(function () {
                    console.log(' => Done with queue-worker, now unlocking queueWorkerLock...');
                    lockfile.unlock(queueWorkerLock, function () {
                        clearTimeout(to);
                        console.log(' => Total suman postinstall optional deps time => ', String(Date.now() - time));
                        process.exit(0);
                    });

                });
            }

        });

    });


});
