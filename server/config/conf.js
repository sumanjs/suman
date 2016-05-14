/**
 * Created by denman on 12/16/15.
 */

const os = require('os');
const path = require('path');


module.exports = function () {

    var cwd = process.cwd();

    var cfgPath = process.argv.indexOf('--cfg') > -1 ? process.argv[process.argv.indexOf('--cfg') + 1] : null;

    var sumanConfig, serverConfig = null;

    try {
        if (cfgPath) {
            sumanConfig = require(cwd + '/' + cfgPath);
        }
        else {
            sumanConfig = require(__dirname + '/../../default-conf-files/suman.default.conf.js');
        }

    }
    catch (err) {
        throw new Error('Suman server could not resolve the path to your config.');
    }

    if (sumanConfig.servers) {
        serverConfig = sumanConfig.servers[os.hostname()] || sumanConfig.servers['*default'];
    }


    return Object.freeze({
        suman_config: sumanConfig,
        suman_server_config: serverConfig,
        suman_home_dir: path.resolve((process.env.HOME || process.env.USERPROFILE) + '/suman/test_results')
    });


};