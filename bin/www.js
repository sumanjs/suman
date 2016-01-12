/**
 * Created by amills001c on 12/15/15.
 */

var path = require('path');
process.chdir(path.resolve(__dirname + '/../'));


process.on('uncaughtException',function(err){

    console.error(err.stack);

});



var debug = require('debug')('suman-server');
var http = require('http');
var _ = require('underscore');
var socketio = require('socket.io');

var app = require('../app');
app.set('port', process.env.PORT || '6969');
var server = http.createServer(app);

server.listen(app.get('port'));
server.on('error', onError);
server.on('listening', onListening);


var io = socketio(server);

//io.on('connection', function(socket){
//    console.log('a user connected');
//});

io.sockets.on('connection', function(socket) {

    console.log('Client connected.');

    // Disconnect listener
    socket.on('disconnect', function() {
        console.log('Client disconnected.');
    });

    socket.on('TEST_DATA', function(data) {
        console.log('TEST_DATA received');
        //do something sync here
        socket.emit('TEST_DATA_RECEIVED',{});
    });

});


function onError(error) {
    console.log(error);
}


function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Server listening on ' + bind, ', CWD=', process.cwd());
    if (process.send) {
        process.send({msg: 'listening'});
    }
}

process.on("SIGINT", function (code) {
    console.log("sigint caught -" + code);
    process.exit(code);
});


module.exports = server;