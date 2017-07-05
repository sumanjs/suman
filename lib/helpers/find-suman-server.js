'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require('events');
var os = require('os');
var path = require('path');
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var SumanErrors = require('../../config/suman-errors');
exports.findSumanServer = function (serverName) {
    var sumanConfig = _suman.sumanConfig;
    var server = null;
    var hostname = os.hostname();
    if (sumanConfig.servers && serverName) {
        if (sumanConfig.servers[serverName]) {
            server = sumanConfig.servers[serverName];
        }
        else {
            throw new Error(' => Suman usage error => Bad server name ("' + serverName + '"), it does not match any ' +
                'properties on the servers properties in your suman.conf.js file.');
        }
    }
    else if (sumanConfig.servers && sumanConfig.servers[hostname]) {
        server = sumanConfig.servers[hostname];
        _suman.resultBroadcaster.emit(String(suman_events_1.events.USING_SERVER_MARKED_BY_HOSTNAME), hostname, server);
    }
    else if (sumanConfig.servers && sumanConfig.servers['*default']) {
        server = sumanConfig.servers['*default'];
        _suman.resultBroadcaster.emit(String(suman_events_1.events.USING_DEFAULT_SERVER), '*default', server);
    }
    else {
        server = Object.freeze({
            host: '127.0.0.1',
            port: 6969
        });
        _suman.resultBroadcaster.emit(String(suman_events_1.events.USING_FALLBACK_SERVER), server);
    }
    if (!server.host)
        SumanErrors.noHost(true);
    if (!server.port)
        SumanErrors.noPort(true);
    return server;
};
