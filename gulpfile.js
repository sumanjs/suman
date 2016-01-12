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
var tcpp = require('tcp-ping');
var suman = require('./lib');

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


gulp.task('watch_tests', ['suman'], function (cb) {

    //testRunner('./test/build-tests','suman.conf.js');

    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: './test/build-tests',
        configPath: './suman.conf.js'
    }).on('message', function (msg) {
        if(msg === 0){
            console.log('msg from suman runner', msg);
        }
        else{
            msg = new Error(msg);
            console.error(msg);
        }

        cb(null);
    });

});


gulp.task('run_tests', ['suman'], function (cb) {

    //testRunner('./test/build-tests','suman.conf.js');

    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: './test/build-tests',
        configPath: './suman.conf.js'
    }).on('message', function (msg) {
        if(msg === 0){
            console.log('msg from suman runner', msg);
        }
        else{
            msg = new Error(msg);
            console.error(msg);
        }

        cb(null);
    });

});


gulp.task('suman', [], function (cb) {


    //first ping server to make sure it's running, otherwise, continue
    tcpp.probe('127.0.0.1', '6969', function (err, available) {
        if (err) {
            console.error(err.stack);
        }
        else if (available) {
            console.log('suman server already running');
            cb(null);
        }
        else {
            suman.Server({
                configPath: './suman.conf.js'
            }).on('message', function (msg) {
                console.log('msg from suman server', msg);
                cb();
            });
            cb();
        }
    });
});





