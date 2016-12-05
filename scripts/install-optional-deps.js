//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const assert = require('assert');
const util  = require('util');

//async
const async = require('async');
const semver = require('semver');
const ijson = require('siamese');

///////////////////////////////////////////////////////////////////////////////////////////////////

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
console.log(' => cwd in postinstall script =>', cwd);
const projectRoot = path.resolve(cwd + '/../../');
console.log('project root => ', projectRoot);


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
    console.log(' => Suman postinstall process timed out.');
    process.exit(1);
}, 200000);

console.log('=> Installs =>', installs);

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
                    version: val
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

                        console.log('parsed val => ', val);
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
                return cb(err);
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
        throw err;
    }


    async.eachSeries(results, function (result, cb) {


        // const p = path.resolve(sumanHome + '/node_modules/', item);
        // console.log(' => Looking for directory for item =>', item, ' => here => ', p);
        //
        // var stat;
        // var isDirectory = false;
        //
        // try {
        //     stat = fs.statSync(p);
        //     isDirectory = stat.isDirectory();
        // }
        // catch (err) {
        //
        // }

        console.log(' result => ', util.inspect(result));

        const item = result.name;
        const action = result.action;


        var args;

        switch (action) {
            case 'do-nothing':
                return process.nextTick(cb);
            case 'install':
                console.log(' => Installing => ', item, ' at path => ', sumanHome);
                args = ['install', item + '@latest', '--loglevel=error', '--silent', '--progress=false'];
                break;
            case 'update':
                console.log(' => Updating => ', item, ' at path => ', sumanHome);
                args = ['update', item + '@latest', '--loglevel=error', '--silent', '--progress=false'];
                break;
            default:
                return process.nextTick(function(){
                    cb(new Error(' => Switch statement fallthrough.'));
                });
        }


        const n = cp.spawn('npm', args, {
            cwd: sumanHome,
            stdio: ['ignore', fd, fd]
        });

        n.on('close', cb);

    }, function (err) {

        clearTimeout(to);

        if (err) {
            console.error(err.stack || err);
            process.exit(1);
        }
        else {
            console.log(' => Total suman postinstall optional deps time => ', String(Date.now() - time));
            process.exit(0);
        }

    });


});

