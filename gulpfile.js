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

//gulp plugins
var nodemon = require('gulp-nodemon');


//args & env
var argv = process.env.argv;
var $node_env = process.env.NODE_ENV;

//you should be able to run your tests with gulp, instead of npm run blah

//var babel = require('gulp-babel'),
//    browserify = require('browserify'),
//    source = require('vinyl-source-stream'),
//    buffer = require('vinyl-buffer'),
//    rename = require('gulp-rename'),
//    uglify = require('gulp-uglify'),
//    del = require('del');
//
//
//gulp.task('clean-temp', function () {
//    return del(['dest']);
//});
//
//gulp.task('es6-commonjs', ['clean-temp'], function () {
//    return gulp.src(['app/*.js', 'app/**/*.js'])
//        .pipe(babel())
//        .pipe(gulp.dest('dest/temp'));
//});


gulp.task('nodemon', [], function () {

    nodemon({

        script: 'server.js',
        ext: 'js',
        ignore: ['public/*', '*.git/*', '*.idea/*', 'routes/*', 'gulpfile.js'],
        args: [], //TODO: add these from command line
        nodeArgs: ['--harmony_destructuring'],
        env: {
            NODE_ENV: $node_env
        }

    }).on('restart', []);

});
