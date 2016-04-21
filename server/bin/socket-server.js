/**
 * Created by denman on 1/15/2016.
 */

var socketio = require('socket.io');
var fs = require('fs');

module.exports = function(server){


    var io = socketio(server);

//io.on('connection', function(socket){
//    console.log('a user connected');
//});

    io.sockets.on('connection', function (socket) {

        console.log('\nClient connected.\n');

        socket.emit('message','listening');

        // Disconnect listener
        socket.on('disconnect', function () {
            console.log('\nClient disconnected.\n');
        });

        socket.on('TEST_DATA', function (data) {

            try {
                var json = JSON.stringify(data.test);

                if (data.outputPath) {

                    //TODO: this functionality needs to mirror writing to disk in suman test runner etc

                    console.log('TEST_DATA received - data.outputPath:',data.outputPath);

                    process.nextTick(function(){
                        socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
                    });
                  

                    // fs.appendFile(data.outputPath, json += ',', function (err) {
                    //     if (err) {
                    //         console.error(err.stack);
                    //         socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
                    //     }
                    //     else {
                    //         //req.sumanData.success = {msg: 'appended data to ' + data.outputPath};
                    //         socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
                    //     }
                    // });
                }
                else{
                    console.error(new Error('no output path for test data: ' + JSON.stringify(data)).stack);
                }
            }
            catch (err) {
                console.error(err.stack);
                socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
            }


        });

    });

};