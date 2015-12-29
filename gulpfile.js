/**
 * Created by amills001c on 12/9/15.
 */

//core
var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
//var socketio = require('socket.io');
var async = require('async');
var _ = require('underscore');
//var EE = require('events').EventEmitter;
var colors = require('colors/safe');
var request = require('request');
var ijson = require('idempotent-json');
var ping = require("net-ping");

//gulp plugins
var nodemon = require('gulp-nodemon');


//args & env
var argv = process.env.argv;
var $node_env = process.env.NODE_ENV;

//you should be able to run your tests with gulp, instead of npm run blah


gulp.task('nodemon', [], function () {

    nodemon({

        script: 'bin/www',
        ext: 'js',
        ignore: ['public/*', '*.git/*', '*.idea/*', 'routes/*', 'gulpfile.js'],
        args: [], //TODO: add these from command line
        nodeArgs: ['--harmony_destructuring'],
        env: {
            NODE_ENV: $node_env
        }

    }).on('restart', []);

});


var testRunner = require('./index').Runner;

gulp.task('run_tests', ['suman'], function (cb) {

    //testRunner('./test/build-tests','suman.conf.js');

    testRunner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: './test/build-tests',
        configPath: './suman.conf.js'
    }).on('message', function (msg) {
        console.log('msg from suman runner', msg);
        cb();
        process.exit();
    });

});


gulp.task('suman', [], function (cb) {

    //first ping server to make sure it's running, otherwise, continue

    //var session = ping.createSession ();
    //
    //session.pingHost ('localhost:6969', function (error, target) {
    //    if (error){
    var proc = require('./index').Server();
    proc.on('message', function (msg) {
        //session.close();
        console.log('msg from suman server', msg);
        cb();
    });
    //    }
    //    else{
    //        session.close();
    //    }
    //});

});

process.on('message', function () {

});

process.on('exit', function () {
    console.log('gulp is exiting...');
});
