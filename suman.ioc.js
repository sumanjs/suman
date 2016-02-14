/**
 * Created by amills001c on 2/8/16.
 */


//*************************************************************************************************************************************
// this is for dependency injection, y'all
// the purpose is to inject dependencies / values that are acquired *asynchronously*
// synchronous deps should be loaded with the require function, as per usual, but deps and values (such as db values) can and should be loaded via this module
// tests will run in separate processes, but you can use code sharing (not memory sharing) to share setup between tests, which is actually pretty cool
// ****************************************************************************************************************************************


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