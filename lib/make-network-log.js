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


    return {

        /* sendTestData: function sendTestData(data) {

         if (available) {
         available = false;

         request.post({
         url: 'http://localhost:6969/results/done/' + timestamp,
         //body: {},
         headers: {
         'accept': 'application/json',
         'content-type': 'application/json'
         },
         json: {}
         }, function (err, resp, body) {
         var msg;
         if (msg = messages.shift()) {
         sendTestData(msg);
         }
         else {

         ee.emit('available');
         available = true;
         socket.emit('my other event', {my: 'data'});
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
                socket.emit('TEST_DATA', {data: data});
            }
            else {
                messages.push(data);
            }
        },

        createNewTestRun: function createNewTestRun(data, cb) {

            var self = this;

            if (config.output && config.output.web) {
                try {
                    var outputDir = config.output.web.outputDir;
                    var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + timestamp);
                    fs.mkdirSync(outputPath);
                }
                catch (err) {
                    console.error(err);
                    return;
                }
            }


            //http.request({
            //    method:'POST',
            //    hostname: 'localhost',
            //    port: 6969,
            //    path: '/results/new',
            //    agent: false  // create a new agent just for this one request
            //}, (res) => {
            //
            //    cb(null);
            //
            //})

            tcpp.probe('127.0.0.1', '6969', function (err, avail) {
                if (err) {
                    cb(err);
                }
                else if (avail) {

                    socket = socketio('http://localhost:6969');

                    socket.on('TEST_DATA_RECEIVED', function () {
                        var msg = messages.shift();
                        isSocketAvailable = true;
                        if(msg){
                            self.sendTestData(msg);
                        }
                        else{
                            setup.messagesCount = messages.length;
                            ee.emit('SOCKET_DONE');
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
                                json: {}
                            }, function (err, resp, body) {
                                cb(err);
                            });
                        }
                    ], function complete(err, results) {
                        cb(err);
                    });


                }
                else {
                    cb(new Error('Suman server not currently live.'));
                }
            });

        }
    };


}