'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var Client = require("socket.io-client");
var client = null;
var _suman = global.__suman = (global.__suman || {});
exports.getClient = function () {
    if (!client) {
        var port = process.env.SUMAN_SOCKETIO_SERVER_PORT;
        try {
            if (window && !port) {
                port = Number(window.__suman.SUMAN_SOCKETIO_SERVER_PORT);
            }
        }
        catch (err) { }
        if (!port) {
            throw new Error('Suman implementation error, no port specified by "SUMAN_SOCKETIO_SERVER_PORT" env var.');
        }
        client = Client("http://localhost:" + port);
        client.on('connect', function () {
            _suman.log.warning('client connected.');
        });
        client.on('event', function (data) {
            _suman.log.info('event data => ', data);
        });
        client.on('disconnect', function () {
            _suman.log.error('client disconnected.');
        });
    }
    return client;
};
