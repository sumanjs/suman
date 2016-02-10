/**
 * Created by amills001c on 2/8/16.
 */



var async = require('async');


module.exports = function loadAsyncDepsForSuman(suman, cb) {


    suman.configure({

        'request': function (cb) {

            setTimeout(function () {
                cb(null, require('request'));
            }, 100);

        },
        'socketio': function (cb) {

            setTimeout(function () {
                cb(null, require('socket.io'));
            }, 100);
        },
        'choodles': function (cb) {

            setTimeout(function () {
                cb(null, {
                    choodles: true
                });
            }, 100);
        },
        'roodles': function (cb) {

            setTimeout(function () {
                cb(null, {
                    roodles: false
                });
            }, 100);
        },
        'whoa': function (cb) {

            setTimeout(function () {
                cb(null, {
                    whoa: {
                        chocolate:'yes'
                    }
                });
            }, 100);
        },
        'cherry': function (cb) {

            setTimeout(function () {
                cb(null, {
                    cherry: {
                        garbage: 'no'
                    }
                });
            }, 100);
        }
    });

};