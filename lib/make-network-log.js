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

//local
var sumanErrors = require('../config/suman-errors');
var sumanUtils = require('./suman-utils');
var findSumanServer = require('./find-suman-server');

module.exports = function makeSendTestData(config, timestamp, setup) {

    var socket;
    var isSocketAvailable = true;
    var messages = [];
    var shouldExit = false;

    process.on('exit', function () {

        shouldExit = true;
        /*
         console.log('messages:',messages);
         if(messages.length > 0){
         return {};
         }*/
    });

    /*  process.on('beforeExit',function(){

     console.log('before-exit');
     });*/


    return {

        /*sendTestData: function sendTestData(data) {

         if (isSocketAvailable) {
         isSocketAvailable = false;

         request.post({
         url: 'http://localhost:6969/results/done/' + timestamp,
         //body: {},
         headers: {
         'accept': 'application/json',
         'content-type': 'application/json'
         },
         json: {}
         }, function (err, resp, body) {
         isSocketAvailable = true;
         var msg;
         if (msg = messages.shift()) {
         sendTestData(msg);
         }
         else {
         ee.emit('SOCKET_DONE');
         }
         });

         }
         else {
         messages.push(data);
         }
         },*/


        sendTestData: function sendTestData(data) {

            if (isSocketAvailable) {
                isSocketAvailable = false;
                socket.emit('TEST_DATA', data);
            }
            else {
                messages.push(data);
                setup.messagesCount = messages.length;
            }
        },

        createNewTestRun: function createNewTestRun(sumanConfig, serverName, cb) {

            var self = this;

            cb = _.once(cb);

            var server = findSumanServer(sumanConfig, serverName);

            var timedout = null;

            var to = setTimeout(function () {
                if (timedout === null) {
                    timedout = true;
                    cb(new Error('timedout'));
                }
            }, 5000);

            tcpp.probe(server.host, server.port, function (err, avail) {

                timedout = false;

                if (err) {
                    cb(err);
                }
                else if (avail) {

                    setup.usingLiveSumanServer = true;

                    socket = socketio('http://' + server.host + ':' + server.port);

                    socket.on('TEST_DATA_RECEIVED', function (msg) {

                        if (msg.error) {
                            console.error('TEST_DATA_RECEIVED error: ' + msg.error);
                        }
                        else {
                            isSocketAvailable = true;
                            setup.messagesCount = messages.length;
                            var mzg = messages.shift();
                            if (mzg) {
                                self.sendTestData(mzg);
                                /*setImmediate(function () {
                                 self.sendTestData(mzg);
                                 });*/
                            }
                            else {
                                ee.emit('SOCKET_DONE');
                            }
                        }

                    });

                    async.parallel([
                        function (cb) {
                            cb = _.once(cb);
                            socket.on('connect', function (data) {
                                cb(null);
                            });
                            socket.on('error', function (err) {
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
                    process.stdout.write('\nSuman server not currently live, so saving data locally...\n\n');

                    if (server && server.outputDir) {
                        try {
                            var outputPath = path.resolve(server.outputDir + '/' + timestamp);
                            fs.mkdir(outputPath, function (err) {
                                cb(err);
                            });
                        }
                        catch (err) {
                            console.error(err.stack);
                            cb(err);
                        }
                    }
                    else {
                        process.stdout.write('\nno local server defined, or the server has not outputDir property defined.\n\n');
                        cb(new Error('not configured to output to web.'));
                    }

                }
            });

        }
    };


};