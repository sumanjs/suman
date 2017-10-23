'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var http = require("http");
var fs = require("fs");
var url = require("url");
var path = require("path");
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
    var httpServer = http.createServer(function (req, res) {
        var query = url.parse(req.url, true).query;
        var data;
        try {
            data = JSON.parse(query.data);
        }
        catch (err) {
            var file = path.resolve(_suman.projectRoot + '/' + req.url);
            var strm = fs.createReadStream(file);
            var onError = function (e) {
                if (!res.headersSent) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: e.stack || e }));
                }
            };
            strm.once('error', onError);
            return strm.pipe(res).once('error', onError);
        }
        if (data.path) {
            fs.createReadStream(data.path).pipe(res);
        }
        else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'no path or bundle.' }));
        }
    });
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
