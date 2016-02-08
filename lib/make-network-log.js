/**
 * Created by amills001c on 1/25/16.
 */


/**
 * Created by denman on 1/10/2016.
 */

//core
var http = require('http');
var fs = require('fs');
var path = require('path');
var appRootPath = require('app-root-path');
var request = require('request');
var tcpp = require('tcp-ping');
var ee = require('./ee');
var socketio = require('socket.io-client');
var _ = require('underscore');
var async = require('async');
var os = require('os');

//local
var sumanErrors = require('../config/suman-errors');
var sumanUtils = require('./suman-utils');
var findSumanServer = require('./find-suman-server');

module.exports = function makeSendTestData(config, timestamp, setup) {

    var socket;
    var shouldExit = false;


    /*

     process.on('beforeExit',function(){
        console.log('before-exit');
     });

     */


    return {


        sendTestData: function sendTestData(data) {

            socket.emit('TEST_DATA', data);

        },

        createNewTestRun: function createNewTestRun(sumanConfig, server, cb) {

            var self = this;

            cb = _.once(cb);


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

                    var hostname = os.hostname();

                    if (sumanConfig.servers && sumanConfig.servers[hostname] && sumanConfig.servers[hostname].outputDir) {
                        try {
                            var dir = sumanConfig.servers[hostname].outputDir;
                            var outputPath = path.resolve(dir + '/' + timestamp);
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
    };

};