


//core
const path = require('path');
const util = require('util');
const os = require('os');
const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');

//npm
const tcpp = require('tcp-ping');
const socketio = require('socket.io-client');

//project
const findSumanServer = require('./find-suman-server');
const sumanUtils = require('suman-utils/utils');

const projectRoot = global.projectRoot || sumanUtils.findProjectRoot(process.cwd());


module.exports = function Server(obj, cb) {

    obj = obj || {};

    cb = cb || function (err) {
            if (err) {
                console.error(err.stack || err);
            }
        };

    const $NODE_ENV = obj.$node_env || process.env.NODE_ENV;

    // const sumanExecutablePath = path.resolve(projectRoot + '/node_modules/.bin/suman');
    const sumanExecutablePath = path.resolve(__dirname, '..', 'index.js');

    var sumanConfig;
    if (typeof obj.config === 'object') {   //TODO: do at least one more check here
        sumanConfig = obj.config;
    }
    else {
        sumanConfig = obj.configPath ? require(path.resolve(projectRoot + '/' + obj.configPath)) : null;
    }

    var server = findSumanServer(obj.serverName);

    if (server == null) {
        var defaultConfig = require(path.resolve(__dirname + '/../default-conf-files/suman.default.conf.js'));
        server = defaultConfig.servers['*default'];
    }

    assert(server.host, 'No server host.');
    assert(server.port, 'No server port.');

    const ret = {
        host: server.host,
        port: server.port,
        alreadyLive: null
    };

    tcpp.probe(server.host, server.port, function (err, available) {

        if (err) {
            console.log('tcpp probe error:', err.stack || err);
            return cb(err, ret);
        }

        ret.alreadyLive = !!available;

        if (available) {
            if (global.sumanOpts.verbose) {
                console.log('\n', ' => Suman server is already live.', '\n');
            }

            cb(null, ret);
        }
        else {

            const sumanCombinedOpts = JSON.stringify({
                sumanMatchesAny: global.sumanMatchesAny.map(i => i.toString().slice(1, -1)),
                sumanMatchesNone: global.sumanMatchesNone.map(i => i.toString().slice(1, -1)),
                sumanMatchesAll: global.sumanMatchesAll.map(i => i.toString().slice(1, -1)),
                sumanHelperDirRoot: global.sumanHelperDirRoot,
                verbose: global.sumanOpts.verbose,
                vverbose: global.sumanOpts.vverbose
            });

            var n, file;
            if (os.platform() === 'win32') {
                file = path.resolve(__dirname + '/../server/start-server.bat');
                n = cp.exec(file, [], {
                    detached: false,
                    env: Object.assign({}, process.env, {
                        SUMAN_SERVER_OPTS: sumanCombinedOpts,
                        NODE_ENV: $NODE_ENV || process.env.NODE_ENV,
                        SUMAN_CONFIG: JSON.stringify(sumanConfig),
                        SUMAN_PROJECT_ROOT: projectRoot,
                        SUMAN_EXECUTABLE_PATH: sumanExecutablePath
                    })
                });
            }
            else {
                //TODO: configure 'open' command to use bash instead of Xcode

                file = require.resolve(projectRoot + '/node_modules/suman-server');

                const p = path.resolve(global.sumanHelperDirRoot + '/logs/server.log');

                fs.writeFileSync(p, '\n\n => Suman server started by user on ' + new Date(), {
                    flags: 'w',
                    flag: 'w'
                });

                n = cp.spawn('node', [file], {
                    env: Object.assign({}, process.env, {
                        SUMAN_SERVER_OPTS: sumanCombinedOpts,
                        NODE_ENV: $NODE_ENV || process.env.NODE_ENV,
                        SUMAN_CONFIG: JSON.stringify(sumanConfig),
                        SUMAN_PROJECT_ROOT: projectRoot,
                        SUMAN_EXECUTABLE_PATH: sumanExecutablePath
                    }),
                    detached: true,
                    stdio: ['ignore', fs.openSync(p, 'a'), fs.openSync(p, 'a')]
                });

                n.on('error', function (err) {
                    console.error(err.stack || err);
                });
            }

            setImmediate(function () {
                cb(null, ret);
            });
        }

    });

};