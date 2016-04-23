/**
 * Created by denman on 12/15/15.
 */




process.on('SIGINT', function (code) {
    console.log('...SIGINT caught, code => ' + code, ', exiting ...');
    process.exit(code);
});

process.on('uncaughtException', function (err) {
    console.error('=> Suman Server => Uncaught Exception => ' + err.stack);
});

/////////////////////////////////////////////////////////////

const path = require('path');
const http = require('http');
const _ = require('underscore');
const fs = require('fs');
const async = require('async');
const colors = require('colors');

//////////////////////////////////////////////////////////////

const sumanUtils = require('../../lib/utils');


//config
var config = require('adore')(module, '*suman*', 'server/config/conf');


const root = sumanUtils.findProjectRoot(path.resolve(__dirname + '/../../../../'));

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

console.log('\n', ' => Suman config used: ', configPath);

const sumanLogos = require('../../lib/ascii');
console.log(sumanLogos.suman_alligator);


/////////////////////////////////////////////////////////////////////////

const app = require('../app');
app.set('port', process.env.PORT || '6969');
const socketServer = require('./socket-server');
const httpServer = http.createServer(app);

async.parallel([

    function (cb) {
        //ensure that results directory exists, handle any error that is not EEXISTS error
        sumanUtils.makeResultsDir(true, sumanConfig, function (err) {
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
        console.log('Results:', results);
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

