/**
 * Created by amills001c on 12/15/15.
 */

var path = require('path');
process.chdir(path.resolve(__dirname + '/../')); // TODO ? why ?


process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception => ' + err.stack);
});


//config
var config = require('univ-config')(module, '*suman*', 'server/config/conf');

console.log(JSON.stringify(config));


var sumanLogos = require('../../lib/ascii');
console.log(sumanLogos.suman_alligator);


var debug = require('debug')('suman:server');
var http = require('http');
var _ = require('underscore');

var app = require('../app');
app.set('port', process.env.PORT || '6969');
var httpServer = http.createServer(app);
var socketServer = require('./socket-server');

httpServer.listen(app.get('port'));
httpServer.on('error', onError);
httpServer.on('listening', onListening);


function onError(error) {
    console.error(error.stack);
}

var sock = true;

function onListening() {

    var addr = httpServer.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('\tServer listening on ' + bind, ', CWD =', process.cwd() + '\n\n');

    if (sock) {
        sock = false;
        socketServer(httpServer);
    }

}

process.on('SIGINT', function (code) {
    console.log('...SIGINT caught, code => ' + code, ', exiting ...');
    process.exit(code);
});


module.exports = httpServer;