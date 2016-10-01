

module.exports = () => {  //load async deps for any of your suman tests

    return {

        'william': function(data, cb){

            setTimeout(function(){
                 cb(null, 10);
            }, 100);

        },

        'socketio': function(){
             return {
                 'dummy':'dummy socketio'
             }
        },

        'should': function(){
            return Promise.resolve(require('should'));
        },
        'request': function () {
            return require('request');  //this is not very useful, but below we can see useful asynchronous loading of deps
        },
        'socket_io_client': function () {
            return require('socket.io-client');
        },
        'choodles': function (data, cb) {

            setTimeout(function () {
                cb(null, {
                    choodles: true
                });
            }, 100);
        },
        'roodles': function (data, cb) {

            setTimeout(function () {
                cb(null, {
                    roodles: false
                });
            }, 100);
        },
        'whoa': function (data, cb) {

            setTimeout(function () {
                cb(null, {
                    whoa: {
                        chocolate: 'yes'
                    }
                });
            }, 100);
        },
        'cherry': function (data, cb) {

            setTimeout(function () {
                cb(null, {
                    cherry: {
                        garbage: 'no'
                    }
                });
            }, 100);
        }
    };

};