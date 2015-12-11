/**
 * Created by amills001c on 12/11/15.
 */



var http = require('http');

const PORT = 6969;

var allRoutes = require('./routes/all');

var server = http.createServer(allRoutes);

server.listen(PORT, function () {
    console.log("Server listening on: http://localhost:%s", PORT);
});