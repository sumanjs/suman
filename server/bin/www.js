/**
 * Created by amills001c on 12/15/15.
 */

var path = require('path');
process.chdir(path.resolve(__dirname + '/../'));


process.on('uncaughtException', function (err) {

    console.error(err.stack);

});


var debug = require('debug')('suman:server');
var http = require('http');
var _ = require('underscore');

var app = require('../app');
app.set('port', process.env.PORT || '6969');
var server = http.createServer(app);
var socketServer = require('./socket-server');

server.listen(app.get('port'));
server.on('error', onError);
server.on('listening', onListening);


function onError(error) {
    console.log(error);
}

var sock = true;

function onListening() {

    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Server listening on ' + bind, ', CWD=', process.cwd());
    if (process.send) {
        process.stdout.write('sending message that I am listening...');
        process.send({msg: 'listening'});
    }
    else {
        process.stdout.write('process.send is not define, so I cannot send message that I am listening...');
    }

    if (sock) {
        sock = false;
        socketServer(server);
    }

}

process.on("SIGINT", function (code) {
    console.log("sigint caught -" + code);
    process.exit(code);
});


module.exports = server;