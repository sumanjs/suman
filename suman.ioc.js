/**
 * Created by amills001c on 2/8/16.
 */



var async = require('async');


module.exports = function loadAsyncDepsForSuman(suman, cb) {


    suman.configure({

        'request': function (cb) {

            setTimeout(function () {
                cb(null, require('request'));
            }, 1000);

        },
        'socket.io': function (cb) {

            setTimeout(function () {
                cb(null, require('socket.io'));
            }, 1000);
        },
        'choodles': function (cb) {

            setTimeout(function () {
                cb(null, {
                    choodles: true
                });
            }, 1000);
        },
        'roodles': function (cb) {

            setTimeout(function () {
                cb(null, {
                    roodles: false
                });
            }, 1000);
        },
        'whoa': function (cb) {

            setTimeout(function () {
                cb(null, {
                    whoa: {
                        chocolate:'yes'
                    }
                });
            }, 1000);
        },
        'cherry': function (cb) {

            setTimeout(function () {
                cb(null, {
                    cherry: {
                        garbage: 'no'
                    }
                });
            }, 1000);
        }
    });

};