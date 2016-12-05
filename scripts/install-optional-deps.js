//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

//async
const async = require('async');


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

const cwd = process.cwd();
console.log(' => cwd in postinstall script =>', cwd);
const projectRoot = path.resolve(cwd + '/../../');
console.log('project root => ', projectRoot);

var pkgDotJSON;

try {
    pkgDotJSON = require(path.resolve(projectRoot + '/package.json'));
}
catch (err) {
    console.error('\n', ' => Suman postinstall error => \n', err.stack || err, '\n');
    process.exit(1);
    return;
}

const sumanConf = require(path.resolve(projectRoot + '/suman.conf.js'));

//always install latest for now
const installs = [];

if (sumanConf.useBabel || true) {
    installs.concat(Object.keys(deps.babel));
}

if (sumanConf.useSumanServer || true) {
    installs.concat(Object.keys(deps.sumanServer));
}

if (sumanConf.useSumanInteractive || true) {
    installs.concat(Object.keys(deps.sumanInteractive));
}

if (sumanConf.useIstanbul || true) {
    installs.concat(Object.keys(deps.istanbul));
}

const sumanHome = path.resolve(process.env.HOME + '/.suman');

const debugLog = path.resolve(sumanHome + '/suman-debug.log');

//200 second timeout...
const to = setTimeout(function () {
    console.log(' => Suman postinstall process timed out.');
    process.exit(1);
}, 200000);

async.eachSeries(installs, function (item, cb) {

    const n = cp.spawn('npm'['install', item + '@latest', '--loglevel=error', '--silent', '--progress=false'], {
        cwd: sumanHome,
        stdio: ['ignore', fs.openSync(debugLog, 'a'), fs.openSync(debugLog, 'a')]
    });

    n.on('close', cb);

}, function (err) {

    clearTimeout(to);

    if (err) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }

});
