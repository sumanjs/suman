/**
 * Created by denman on 1/10/2016.
 */


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
                messages.push(data)
                setup.messagesCount = messages.length;
            }
        },

        createNewTestRun: function createNewTestRun(datums, cb) {

            var self = this;

            tcpp.probe('127.0.0.1', '6969', function (err, avail) {
                if (err) {
                    cb(err);
                }
                else if (avail) {

                    setup.serverIsLive = true;

                    socket = socketio('http://localhost:6969');

                    socket.on('TEST_DATA_RECEIVED', function (msg) {

                        if(msg.error){
                            console.error(msg.error);
                        }
                        else{
                            isSocketAvailable = true;
                            setup.messagesCount = messages.length;
                            var msg = messages.shift();
                            if (msg) {
                                self.sendTestData(msg);
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
                                url: 'http://localhost:6969/results/make/new',
                                json: {
                                    timestamp: timestamp,
                                    config: config
                                }
                            }, function (err, resp, body) {
                                cb(err);
                            });
                        }
                    ], function complete(err, results) {
                        cb(err,true);
                    });


                }
                else {
                    process.stdout.write('\nSuman server not currently live, so saving data locally...\n\n');
                    if (config.output && config.output.web) {
                        try {
                            var outputDir = config.output.web.outputDir;
                            var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + timestamp);
                            fs.mkdir(outputPath, function(err){
                                cb(err);
                            });
                        }
                        catch (err) {
                            console.error(err.stack);
                            cb(err);
                        }
                    }
                    else{
                        cb(new Error('not configured to output to web.'));
                    }

                }
            });

        }
    };


};