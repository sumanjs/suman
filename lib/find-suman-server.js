/**
 * Created by amills001c on 1/15/16.
 */

const os = require('os');
const SumanErrors = require('../config/suman-errors');
const sumanUtils = require('./utils');
const path = require('path');

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
        server = Object.freeze({
            host: '127.0.0.1',
            port: 6969,
            outputDir: path.resolve(sumanUtils.getHomeDir() + '/suman_results')
        });
    }


    if (!server.host) SumanErrors.noHost(true);
    if (!server.port) SumanErrors.noPort(true);

    return server;

};