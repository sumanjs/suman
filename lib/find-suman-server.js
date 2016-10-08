/**
 * Created by denman on 1/15/16.
 */


//core
const os = require('os');
const path = require('path');

//project
const SumanErrors = require('../config/suman-errors');
const sumanUtils = require('./utils');

module.exports = function findSumanServer(serverName) {

    const sumanConfig = global.sumanConfig;
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
    }

    else if (sumanConfig.servers && sumanConfig.servers['*default']) {
        server = sumanConfig.servers['*default']
    }

    else {
        server = Object.freeze({
            host: '127.0.0.1',
            port: 6969
        });
    }


    if (!server.host) SumanErrors.noHost(true);
    if (!server.port) SumanErrors.noPort(true);

    return server;

};