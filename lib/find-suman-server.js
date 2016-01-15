/**
 * Created by amills001c on 1/15/16.
 */


var SumanErrors = require('../config/suman-errors');

module.exports = function findSumanServer(sumanConfig, serverName){

    var server = null;

    if (sumanConfig && sumanConfig.servers) {

        if (serverName) {
            server = sumanConfig.servers[serverName];
            if (!server) {
                throw new Error('no server specified in config.servers with name=' + serverName);
            }

        }
        else if (sumanConfig.defaultServer && typeof sumanConfig.defaultServer === 'string') {
            server = sumanConfig.servers[sumanConfig.defaultServer];
            if (!server) {
                throw new Error('no server specified in config.servers with name given by config.defaultServer=' + sumanConfig.defaultServer);
            }
        }
    }

    if (!server) {
        server = {
            host: '127.0.0.1',
            port: '6969'
        }
    }

    if (!server.host) SumanErrors.noHost(true);
    if (!server.port) SumanErrors.noPort(true);

    return server;

};