/**
 * Created by amills001c on 1/15/16.
 */

const os = require('os');
const SumanErrors = require('../config/suman-errors');

module.exports = function findSumanServer(sumanConfig, serverName) {

    var server = null;
    var hostname = os.hostname();

    if (sumanConfig.servers && serverName) {
        server = sumanConfig.servers[serverName] ? sumanConfig.servers[serverName] : (function badServerName() {
            throw new Error('Bad server name, does not match any items in your config => "' + serverName +'"');
        })();

    }
    else if (sumanConfig.servers && sumanConfig.servers[hostname]) {
        server = sumanConfig.servers[hostname];
    }

    else if(sumanConfig.servers && sumanConfig.servers['*default']){
        server = sumanConfig.servers['*default']
    }

    else {
        //throw new Error('Could not find any server with your input.');
        return null;
    }


    if (!server.host) SumanErrors.noHost(true);
    if (!server.port) SumanErrors.noPort(true);

    return server;

};