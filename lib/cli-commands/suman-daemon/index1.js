'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var net = require("net");
var util = require("util");
var poolio_1 = require("poolio");
var JSONStream = require("JSONStream");
console.log('starting this thing.');
exports.run = function (projectRoot, sumanLibRoot, cb) {
    if (process.argv.indexOf('--daemon') < 1) {
        console.log('not a daemon process.');
        return process.nextTick(cb);
    }
    if (!process.stdout.isTTY) {
        return process.nextTick(cb, 'process is not a tty, cannot run suman-daemon.');
    }
    var f = path.resolve(process.env.HOME + '/.suman/daemon.pid');
    try {
        fs.writeFileSync(f, String(process.pid));
    }
    catch (err) {
        return process.nextTick(cb, err);
    }
    console.log('suman daemon loaded.');
    var p = new poolio_1.Pool({
        filePath: path.resolve(__dirname + '/start-script.js'),
        size: 3,
        env: Object.assign({}, process.env, {
            SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
            SUMAN_PROJECT_ROOT: projectRoot
        }),
        streamStdioAfterDelegation: true,
        oneTimeOnly: true,
        inheritStdio: false,
        resolveWhenWorkerExits: true
    });
    p.on('error', function (e) {
        console.error('pool error => ', e.stack || e);
    });
    var s = net.createServer(function (socket) {
        console.log('socket connection made.');
        socket.pipe(JSONStream.parse()).on('data', function (obj) {
            console.log('message from ', util.inspect(obj));
            return p.any(obj, { socket: socket });
        });
    });
    var port = 9091;
    s.once('listening', function () {
        console.log("suman daemon tcp server listening on port " + port);
    });
    s.listen(port);
};
exports.run2 = function (projectRoot, cb) {
    if (process.argv.indexOf('--daemon') < 1) {
        console.log('no daemon');
        return process.nextTick(cb);
    }
    var f = path.resolve(process.env.HOME + '/.suman/daemon.pid');
    try {
        fs.writeFileSync(f, String(process.pid));
    }
    catch (err) {
        return process.nextTick(cb, err);
    }
    console.log('suman daemon loaded.');
    var p = path.resolve(projectRoot + '/SUMANPIPEIN');
    var fd = fs.openSync(p, fs.constants.O_NONBLOCK | fs.constants.O_RDWR);
    var socket = new net.Socket({ fd: fd, readable: true, writable: true });
    socket.on('data', function (d) {
        if (String(d).trim() === '[stdin end]') {
            console.log('received stdin and stuff.');
            return process.nextTick(cb);
        }
        console.log('received command line argument => ', d);
        process.argv.push(String(d).trim());
    });
    var pkg = require('../../../package.json');
    Object.keys(pkg.dependencies).forEach(function (name) {
        try {
            require(name);
        }
        catch (err) {
            console.error(err.message);
        }
    });
};
exports.run3 = function (projectRoot, sumanLibRoot, cb) {
    if (process.argv.indexOf('--daemon') < 1) {
        console.log('not a daemon process.');
        return process.nextTick(cb);
    }
    if (!process.stdout.isTTY) {
        return process.nextTick(cb, 'process is not a tty, cannot run suman-daemon.');
    }
    var f = path.resolve(process.env.HOME + '/.suman/daemon.pid');
    try {
        fs.writeFileSync(f, String(process.pid));
    }
    catch (err) {
        return process.nextTick(cb, err);
    }
    console.log('suman daemon loaded.');
    var p = new poolio_1.Pool({
        filePath: path.resolve(__dirname + '/start-script.js'),
        size: 3,
        env: Object.assign({}, process.env, {
            SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
            SUMAN_PROJECT_ROOT: projectRoot
        }),
        streamStdioAfterDelegation: true,
        oneTimeOnly: true,
        inheritStdio: false,
        resolveWhenWorkerExits: true,
    });
    p.on('error', function (e) {
        console.error('pool error => ', e.stack || e);
    });
    console.log('listening for stdin...');
    var rawData = '';
    var pid = null;
    var file = null;
    process.stdin
        .setEncoding('utf8')
        .resume()
        .on('data', function (d) {
        console.log(p.getCurrentStats());
        rawData += String(d);
        if (rawData.match('stdin-end')) {
            var argz = String(rawData).match(/\S+/g);
            rawData = '';
            var args = argz.filter(function (item) {
                if (item.match('#pid')) {
                    pid = item.split('#')[0];
                    return false;
                }
                if (item.match('SUMAN_FILE_TO_LOG')) {
                    file = item.split('#')[0];
                    console.log('file in index => ', file);
                    return false;
                }
                if (item.match('stdin-end')) {
                    return false;
                }
                return true;
            });
            return p.any({ args: args, pid: pid }, { file: file });
        }
    });
};
