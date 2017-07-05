'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var Client = require("socket.io-client");
var client = null;
exports.getClient = function () {
    if (!client) {
        client = Client("http://localhost:" + process.env.SUMAN_SOCKETIO_SERVER_PORT);
        client.on('connect', function () {
            console.log('client connected.');
        });
        client.on('event', function (data) {
            console.log('event data => ', data);
        });
        client.on('disconnect', function () {
            console.log('client disconnected.');
        });
    }
    return client;
};
