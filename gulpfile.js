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
//var colors = require('colors/safe');
const chalk = require('chalk');
var request = require('request');
var ijson = require('idempotent-json');
var suman = require('./lib');
var sumanConstants = suman.constants;

//gulp plugins
var babel = require('gulp-babel');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var rename = require('gulp-rename');
var nodemon = require('gulp-nodemon');

//args & env
var argv = process.env.argv;
var $node_env = process.env.NODE_ENV;

//you should be able to run your tests with gulp, instead of npm run blah


gulp.task('clean-temp', function () {
    return del(['dest']);
});

gulp.task('es6-commonjs', [/*'clean-temp'*/], function () {
    return gulp.src(['test/*.js', 'test/**/*.js'])
        .pipe(babel())
        .pipe(gulp.dest('test-dest'));
});


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
        if (msg === 0) {
            console.log('msg from suman runner', msg);
        }
        else {
            msg = new Error(msg);
            console.error(msg);
        }

        cb(null);
    });

});


gulp.task('run_tests', ['suman'], function (cb) {

    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: ['test/build-tests', 'test/integration-tests'],
        configPath: 'suman.conf.js',
        runOutputInNewTerminalWindow: false
    }).on('message', function (msg) {
        console.log('message:', msg);
    }).on('data', function (data) {
        console.log('data:', data);
    }).on('error', function (err) {
        cb(err);
    }).on('exit', function (code) {
        cb(null);
    });

});

gulp.task('run_all_tests', ['suman_server'], function (cb) {

    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: ['test/build-tests'],
        configPath: 'suman.conf.js',
        runOutputInNewTerminalWindow: false
    }).on('message', function (msg) {
        console.log('message:', msg);
    }).on('data', function (data) {
        console.log('data:', data);
    }).on('error', function (err) {
        cb(err);
    }).on('exit', function (code) {
        cb(null);
    });

});


gulp.task('suman_server', [], function (cb) {

    suman.Server({
        configPath: './suman.conf.js'
    }).on('msg', function (msg) {
        console.log('msg', msg);
        cb();
    }).on('msg-2', function (msg) {
        console.log('msg-2', msg);
    });

});





