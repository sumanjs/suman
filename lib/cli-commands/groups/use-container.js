'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var suman_utils_1 = require("suman-utils");
var chalk = require("chalk");
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var debug = require('suman-debug')('s:groups');
exports.runUseContainer = function (strm, item, cb) {
    var projectRoot = _suman.projectRoot, sumanOpts = _suman.sumanOpts;
    async.waterfall([
        function getExistingImage(cb) {
            var race = suman_utils_1.default.once(this, cb);
            setTimeout(function () {
                race(null, {
                    name: item.name,
                    isContainerAlreadyBuilt: null,
                    containerInfo: null
                });
            }, 3000);
            if (!item.allowReuseImage) {
                process.nextTick(function () {
                    race(null, {
                        name: item.name,
                        isContainerAlreadyBuilt: null,
                        containerInfo: null
                    });
                });
            }
            else {
                var n_1 = cp.spawn('bash', [], {
                    cwd: item.cwd || process.cwd()
                });
                n_1.stdin.setEncoding('utf8');
                n_1.stderr.setEncoding('utf8');
                n_1.stdout.setEncoding('utf8');
                n_1.stdin.write('\n' + 'docker images -q ' + item.name + '  2> /dev/null' + '\n');
                process.nextTick(function () {
                    n_1.stdin.end();
                });
                var data_1 = '';
                n_1.stdout.on('data', function (d) {
                    data_1 += String(d);
                });
                if (!sumanOpts.no_stream_to_console) {
                    n_1.stdout.pipe(process.stdout, { end: false });
                    n_1.stderr.pipe(process.stderr, { end: false });
                }
                if (!sumanOpts.no_stream_to_file) {
                    n_1.stdout.pipe(strm, { end: false });
                    n_1.stderr.pipe(strm, { end: false });
                }
                n_1.once('close', function (code) {
                    n_1.unref();
                    console.log('EXIT CODE FOR FINDING EXISTING CONTAINER => ', code);
                    race(null, {
                        name: item.name,
                        isContainerAlreadyBuilt: !!data_1,
                        containerInfo: data_1
                    });
                });
            }
        },
        function buildContainer(data, cb) {
            debug(' => data from check existing container => ', item);
            var name = data.name;
            if (data.isContainerAlreadyBuilt) {
                debug(' => Container is already built => ', data);
                process.nextTick(function () {
                    cb(null, {
                        name: name,
                        code: 0
                    });
                });
            }
            else {
                debug(' => Container is *not* already built....building...');
                var b = item.build();
                console.log(' => "Build" container command => ', '"' + b + '"');
                var n_2 = cp.spawn('bash', [], {
                    cwd: item.cwd || process.cwd()
                });
                n_2.stdin.setEncoding('utf8');
                n_2.stderr.setEncoding('utf8');
                n_2.stdout.setEncoding('utf8');
                n_2.stdin.write('\n' + b + '\n');
                process.nextTick(function () {
                    n_2.stdin.end();
                });
                if (!sumanOpts.no_stream_to_console) {
                    n_2.stdout.pipe(process.stdout, { end: false });
                    n_2.stderr.pipe(process.stderr, { end: false });
                }
                if (!sumanOpts.no_stream_to_file) {
                    n_2.stdout.pipe(strm, { end: false });
                    n_2.stderr.pipe(strm, { end: false });
                }
                n_2.once('close', function (code) {
                    n_2.unref();
                    console.log('EXIT CODE OF CONTAINER BUILD => ', code);
                    cb(null, {
                        name: name,
                        code: code
                    });
                });
            }
        },
        function runContainer(data, cb) {
            var code = data.code;
            var name = data.name;
            if (code > 0) {
                console.error('\n', chalk.red.bold(' => Exit code of container build command was greater than zero, ' +
                    'so we are not running the container.'), '\n');
                return process.nextTick(function () {
                    cb(null, {
                        code: code,
                        name: name
                    });
                });
            }
            var r = item.run();
            debug(' => Run container command ', '"' + r + '"');
            var n = cp.spawn('bash', [], {
                cwd: item.cwd || process.cwd()
            });
            n.stdin.setEncoding('utf8');
            n.stdout.setEncoding('utf8');
            n.stderr.setEncoding('utf8');
            n.stdin.write('\n' + r + '\n');
            process.nextTick(function () {
                n.stdin.end();
            });
            if (!sumanOpts.no_stream_to_console) {
                n.stdout.pipe(process.stdout, { end: false });
                n.stderr.pipe(process.stderr, { end: false });
            }
            if (!sumanOpts.no_stream_to_file) {
                n.stdout.pipe(strm, { end: false });
                n.stderr.pipe(strm, { end: false });
            }
            n.once('close', function (code) {
                n.unref();
                console.log('EXIT CODE OF CONTAINER RUN => ', code);
                cb(null, {
                    code: code,
                    name: name
                });
            });
        }
    ], cb);
};
