
var globalErr;

process.on('exit', function (code) {
    if(globalErr){
        console.error('\n\n => Suman Server => Uncaught Exception => ' + globalErr.stack + '\n\n');
    }
    console.log('\n => Suman server exiting with code => ', code, '\n');
});

process.on('SIGINT', function (code) {
    console.log('...SIGINT caught, code => ' + code, ', exiting ...');
    process.exit(code);
});

process.on('uncaughtException', function (err) {
    console.error('\n\n => Suman Server => Uncaught Exception => ' + err.stack,'\n');
    globalErr = err;
    process.nextTick(function(){
        process.exit(1);
    });
});

/////////////////////////////////////////////////////////////

//core
const util = require('util');
const path = require('path');
const http = require('http');
const _ = require('underscore');
const fs = require('fs');
const async = require('async');
const colors = require('colors');

//////////////////////////////////////////////////////////////

const sumanUtils = require('../../lib/utils');
const cwd = process.cwd();
const root = global.projectRoot = sumanUtils.findProjectRoot(cwd);

if (!root) {
    console.log(' => Warning => A Node.js project root could not be found given your current working directory.');
    console.log(colors.bgRed.white(' => cwd:', cwd, ' '));
    console.log(' => Please execute the suman command from within the root of your project.\n\n');
    return;
}

if (cwd !== root) {
    console.log(' => CWD:', cwd);
    console.log(' => Project root:', root);
}

///////////////////////////////////////////////////////////////////////

//config
var config = require('adore')(module, '*suman*', 'server/config/conf');

var configPath, sumanConfig = null;

try {
    configPath = path.resolve(root + '/suman.conf.js');
    sumanConfig = require(configPath);
    console.log(colors.cyan(' => Suman Server message => using config at path => ' + configPath));
}
catch (err) {
    console.log(colors.yellow(' => Suman Server warning => Could not find a suman.conf.js config file in the root of your project. Using default config.'));
    configPath = path.resolve(__dirname + '/../../default-conf-files/suman.default.conf.js');
    sumanConfig = require(configPath);
}

global.sumanConfig = sumanConfig;
console.log(' => Suman config used: ', configPath);

const sumanLogos = require('../../lib/ascii');
console.log(sumanLogos.suman_alligator);

const index = process.argv.indexOf('--suman-combined-opts');
const sumanCombinedOpts = global.sumanCombinedOpts = (index > -1) ? JSON.parse(process.argv[index + 1]) : {

    sumanMatches: sumanConfig.match,
    sumanNotMatches: sumanConfig.notMatch,
    sumanHelperDirRoot: sumanConfig.sumanHelpersDir,
    verbose: true,
    vverbose: true

};

Object.keys(sumanCombinedOpts).forEach(opt => {
    global[opt] = sumanCombinedOpts[opt];
});

const opts = global.sumanOpts = global.sumanOpts || {};
opts.verbose = sumanCombinedOpts.verbose;
opts.vverbose = sumanCombinedOpts.vverbose;


////////////////////////////////////////////////////////////////////////

//TODO possibly reconcile these with cmd line options
const testDir = global._sTestDir = global.sumanConfig.testDir;
const testSrcDir = global._sTestSrcDir = global.sumanConfig.testSrcDir;
const testDestDir = global._sTestDestDir = global.sumanConfig.testDestDir;
const testDirCopyDir = global._sTestDirCopyDir = global.sumanConfig.testDirCopyDir;


/////////////////////////////////////////////////////////////////////////

const app = require('../app');
app.set('port', process.env.PORT || '6969');
const socketServer = require('./socket-server');
const httpServer = http.createServer(app);

async.parallel([

    function (cb) {
        //ensure that results directory exists, handle any error that is not EEXISTS error
        sumanUtils.makeResultsDir(true, function (err) {
            cb(err);
        });
    },
    function (cb) {

        httpServer.listen(app.get('port'));
        httpServer.once('error', onError);
        httpServer.once('listening', onListening);
        socketServer(httpServer);
        cb();

    }

], function (err, results) {

    if (err) {
        throw err;
    }
    else {
        if (results.filter(r => r).length) {
            console.log('Results:', util.inspect(results));
        }
    }

});

/////////////////////////////////////////////////////////////////////////

function onError(error) {
    console.error(error.stack);
}

function onListening() {

    const addr = httpServer.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('\tServer listening on ' + bind, ', CWD =', process.cwd() + '\n\n');

}

