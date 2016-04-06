/**
 * Created by denman on 1/25/16.
 */


//#core
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

//#npm
const request = require('request');
const tcpp = require('tcp-ping');
const socketio = require('socket.io-client');
const _ = require('underscore');
const async = require('async');

//#project
const sumanErrors = require('../config/suman-errors');
const sumanUtils = require('./utils');
const findSumanServer = require('./find-suman-server');


module.exports = function makeSendTestData(config, timestamp, setup) {

    var socket;
    var shouldExit = false;

    const cwd = process.cwd();
    const hostname = os.hostname();


    return {

        sendTestData: function sendTestData(data) {

            //if(socket){
            socket.emit('TEST_DATA', data);
            //}

        },

        createNewTestRun: function createNewTestRun(sumanConfig, server, cb) {

            var self = this;

            cb = _.once(cb);


            if (!server) {

                var dir = sumanUtils.getHomeDir();
                var outputPath = path.resolve(dir + '/suman_results/' + timestamp);
                fs.mkdir(outputPath, function (err) {
                    cb(err, false, outputPath);
                });

            }
            else {

                var timedout = null;

                var to = setTimeout(function () {
                    if (timedout === null) {
                        timedout = true;
                        cb(new Error('timedout'));
                    }
                }, 5000);

                tcpp.probe(server.host, server.port, function (err, avail) {

                    timedout = false;
                    clearTimeout(to);

                    if (err) {
                        cb(err);
                    }
                    else if (avail) {

                        setup.usingLiveSumanServer = true;

                        socket = socketio('http://' + server.host + ':' + server.port);

                        async.parallel([
                            function (cb) {
                                cb = _.once(cb);
                                socket.on('connect', function (data) {
                                    cb(null);
                                });
                                socket.on('error', function (err) {
                                    cb(err);
                                });
                                socket.on('connect_error', function (err) {
                                    cb(err);
                                });
                            },
                            function (cb) {
                                request.post({
                                    url: 'http://' + server.host + ':' + server.port + '/results/make/new',
                                    json: {
                                        timestamp: timestamp,
                                        config: config
                                    }
                                }, function (err, resp, body) {
                                    cb(err);
                                });
                            }
                        ], function complete(err, results) {
                            cb(err, true);
                        });


                    }
                    else {

                        //TODO: should be able to use *default server if it's there

                        var outputPath, dir;
                        if (server) {

                            if (server.outputDir) {
                                outputPath = path.resolve(server.outputDir + '/' + timestamp);
                                fs.mkdir(outputPath, function (err) {
                                    cb(err, false, outputPath);
                                });
                            }
                            else {
                                outputPath = path.resolve(sumanUtils.getHomeDir() + '/suman_results/' + timestamp);
                                fs.mkdir(outputPath, function (err) {
                                    cb(err, false, outputPath);
                                });
                            }

                        }
                        else if (sumanConfig.servers && sumanConfig.servers[hostname] && sumanConfig.servers[hostname].outputDir) {
                            try {
                                dir = sumanConfig.servers[hostname].outputDir;
                                outputPath = path.resolve(dir + '/' + timestamp);
                                fs.mkdir(outputPath, function (err) {
                                    cb(err, false, outputPath);
                                });
                            }
                            catch (err) {
                                console.error(err.stack);
                                cb(err, false);
                            }
                        }
                        else if (sumanConfig.servers && sumanConfig.servers['*default'] && sumanConfig.servers['*default'].outputDir) {
                            try {
                                dir = sumanConfig.servers['*default'].outputDir;
                                outputPath = path.resolve(dir + '/' + timestamp);
                                fs.mkdir(outputPath, function (err) {
                                    cb(err, false, outputPath);
                                });
                            }
                            catch (err) {
                                console.error(err.stack);
                                cb(err, false);
                            }
                        }
                        else {
                            process.stdout.write('\nno local server defined, or the server has not outputDir property defined.\n\n');
                            cb(new Error('not configured to output to web.'), false);
                        }

                    }
                });
            }


        }
    };

};