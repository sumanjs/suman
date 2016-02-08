/**
 * Created by amills001c on 2/8/16.
 */



var async = require('async');


module.exports = function loadAsyncDepsForSuman(suman, cb) {

    async.parallel([
        function (cb) {

            setTimeout(function () {
                cb(null, {
                    'request': require('request')
                });
            }, 1000);

        },
        function (cb) {

            setTimeout(function () {
                cb(null, {
                    'socket.io': require('socket.io')
                });
            }, 1000);

        }

    ], function (err, deps) {
        cb(err, deps);
    });


};