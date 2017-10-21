'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var http = require("http");
var SocketServer = require("socket.io");
var _suman = global.__suman = (global.__suman || {});
var io = {
    server: null
};
exports.initializeSocketServer = function (cb) {
    if (_suman.inceptionLevel > 0) {
        io.server = {
            on: function () {
                console.log('sumanception inacted.');
            }
        };
        return process.nextTick(cb, null, -1);
    }
    var httpServer = http.createServer();
    httpServer.once('listening', function () {
        cb(null, this.address().port);
    });
    httpServer.listen(0);
    io.server = SocketServer(httpServer);
};
exports.getSocketServer = function () {
    if (!io.server)
        throw new Error('Suman implementation error - socket.io server was not initialized yet.');
    return io.server;
};
