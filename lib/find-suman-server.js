/**
 * Created by amills001c on 1/15/16.
 */

var os = require('os');
var SumanErrors = require('../config/suman-errors');

module.exports = function findSumanServer(sumanConfig, serverName) {

    var server = null;
    var hostname = os.hostname();

    if (sumanConfig.servers && serverName) {
        server = sumanConfig.servers[serverName] ? sumanConfig.servers[serverName] : (function badServerName() {
            throw new Error('Bad server name, does not match any items in your config => "' + serverName +'"');
        })();

    }
    else if (sumanConfig.servers) {
        server = sumanConfig.servers[hostname] ? sumanConfig.servers[hostname] : (function badServerName() {
            throw new Error('No server in server array matches current hostname => "' + hostname + '"');
        })();
    }

    else {
        throw new Error('Could not find any server with your input.');
    }


    if (!server.host) SumanErrors.noHost(true);
    if (!server.port) SumanErrors.noPort(true);

    return server;

};