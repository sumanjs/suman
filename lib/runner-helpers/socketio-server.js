'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var http = require("http");
var fs = require("fs");
var url = require("url");
var path = require("path");
var SocketServer = require("socket.io");
var replaceStream = require("replacestream");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var io = {
    server: null
};
var getEmbeddedScript = function (port, id) {
    var sumanOptsStr = su.customStringify(_suman.sumanOpts);
    var sumanConfigStr = su.customStringify(_suman.sumanConfig);
    var timestamp = Date.now();
    return [
        '<script>',
        "window.__suman = window.__suman || {};\n",
        "window.__suman.SUMAN_SOCKETIO_SERVER_PORT=" + port + ";\n",
        "window.__suman.SUMAN_CHILD_ID=" + id + ";\n",
        "window.__suman.usingRunner=true;\n",
        "window.__suman.timestamp=" + timestamp + ";\n",
        "window.__suman.sumanConfig=" + sumanConfigStr + ";\n",
        "window.__suman.sumanOpts=" + sumanOptsStr + ";\n",
        '</script>'
    ].join('');
};
exports.initializeSocketServer = function (cb) {
    if (_suman.inceptionLevel > 0) {
        io.server = {
            on: function () {
                _suman.log.warning('sumanception inacted.');
            }
        };
        return process.nextTick(cb, null, -1);
    }
    var sb, getBrowserStream;
    try {
        sb = require('suman-browser');
        getBrowserStream = sb.makeGetBrowserStream(_suman.sumanHelperDirRoot, _suman.sumanConfig, _suman.sumanOpts);
    }
    catch (err) {
        if (_suman.sumanOpts.browser) {
            throw new Error('Please install "suman-browser" using "npm install -D suman-browser".');
        }
        else {
            _suman.log.warning('warning: cannot find browser dependency => ', err.message);
        }
    }
    var regex = /<suman-test-content>.*<\/suman-test-content>/;
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
        if (data.path && data.childId) {
            var port = httpServer.address().port;
            fs.createReadStream(data.path)
                .pipe(replaceStream(regex, getEmbeddedScript(port, data.childId)))
                .pipe(res);
        }
        else if (data.childId) {
            var port = httpServer.address().port;
            var id = data.childId;
            getBrowserStream(port, id, function (err, results) {
                if (err) {
                    return res.end(JSON.stringify({ error: err.stack || err }));
                }
                results.forEach(res.write.bind(res));
                res.end();
            });
        }
        else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'missing path or childId.' }));
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
