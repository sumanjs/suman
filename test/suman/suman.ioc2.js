/**
 * Created by denman on 2/8/16.
 */


// *************************************************************************************************************************************
// this is for dependency injection, y'all
// the purpose is to inject dependencies / values that are acquired *asynchronously*
// synchronous deps should be loaded with the require/import functionality, as per usual, but deps and values (such as db values) can and should be loaded via this module
// Suman tests will run in separate processes, but you can use code sharing (not memory sharing) to share setup between tests, which is actually pretty cool
// ****************************************************************************************************************************************


module.exports = (suman) => {  //load async deps for any of your suman tests

    return {

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

        },

        'dbQueryAllPosts': (cb) => {

            var db = require('./db/postgres');

            db.sync().then(function () {
                return db.posts.find();
            }).then(function (posts) {
                cb(null, posts);          //send 'users' as a value to any test that wants the value
            }).catch(function (err) {
                cb(err);
            });

        },

        'redisClient': function () {
            return require('./db/redis');  //return a dep from our project
        },

        'mockServer': function () {

            var mockServers = require('./mock-servers');
            mockServers.use('local');
            return mockServers.setup(); //returns a promise

        }
    };

};