

module.exports = (suman) => {  //load async deps for any of your suman tests

    suman.configure({

        'request': function () {
            return require('request');  //this is not very useful, but below we can see useful asynchronous loading of deps
        },
        'socketio': function () {
            return require('socket.io');
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
                        chocolate: 'yes'
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