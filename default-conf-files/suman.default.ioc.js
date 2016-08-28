
//******************************************************************************************************************
// this is for dependency injection, y'all
// the purpose is to inject dependencies / values that are acquired *asynchronously*
// synchronous deps should be loaded with the require function, as per usual,
// but deps and values (such as db values) can and should be loaded via this module
// tests will run in separate processes, but you can use code sharing (not memory sharing) to share setup between tests,
// which is actually pretty cool
// ******************************************************************************************************************


module.exports = () => {  //load async deps for any of your suman tests


    return {

        //the following are examples
        
        'request': function () {
            return require('request');  //this is not very useful, but below we can see useful asynchronous loading of deps
        },

        'socketClient': function (cb) {

            const client = require('socket.io-client')('http://localhost:3000');
            client.on('connect', cb);
            client.on('error', cb);

        },

        'dbQueryAllUsers': (cb) => {

            var db = require('./db/postgres');

            db.sync().then(function () {
                return db.users.find();
            }).then(function (users) {
                cb(null, users);          //send 'users' as a value to any test that wants the value
            }).catch(function (err) {
                cb(err);
            });

        }


    }


};
