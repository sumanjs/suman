/**
 * Created by amills001c on 12/15/15.
 */



var debug = require('debug')('suman-server');
var http = require('http');
var _ = require('underscore');


var app = require('../app');
app.set('port', process.env.PORT || '6969');
var server = http.createServer(app);

server.listen(app.get('port'));
server.on('error', onError);
server.on('listening', onListening);


function onError(error) {
    console.log(error);
}


function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Server listening on ' + bind);
    if (process.send) {
        process.send({msg: 'listening'});
    }
}

process.on("SIGINT", function() { console.log("sigint caught") });


module.exports = server;