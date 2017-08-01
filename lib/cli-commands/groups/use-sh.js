'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var path = require("path");
var util = require("util");
var assert = require("assert");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
exports.runUseSh = function (strm, item, cb) {
    var projectRoot = _suman.projectRoot, sumanOpts = _suman.sumanOpts;
    if (item.script) {
        var exec = 'bash';
        if (typeof item.script === 'object') {
            exec = item.script.interpreter || exec;
            item.script = item.script.str;
        }
        assert(typeof item.script === 'string', ' => suman.group item has script property which does not point to a string => ' + util.inspect(item));
        var n_1 = cp.spawn(exec, [], {
            cwd: item.cwd || process.cwd()
        });
        n_1.stdin.setEncoding('utf8');
        n_1.stderr.setEncoding('utf8');
        n_1.stdout.setEncoding('utf8');
        n_1.stdin.write('\n' + item.script + '\n');
        process.nextTick(function () {
            n_1.stdin.end();
        });
        if (!sumanOpts.no_stream_to_console) {
            n_1.stdout.pipe(process.stdout, { end: false });
            n_1.stderr.pipe(process.stderr, { end: false });
        }
        if (!sumanOpts.no_stream_to_file) {
            n_1.stdout.pipe(strm, { end: false });
            n_1.stderr.pipe(strm, { end: false });
        }
        n_1.on('close', function (code) {
            cb(null, {
                code: code,
                name: item.name
            });
        });
    }
    else if (typeof item.getPathToScript === 'function') {
        var b = item.getPathToScript();
        assert(path.isAbsolute(b), ' => Path to group script must be absolute.');
        console.log(chalk.red.bold('path to script => ', b));
        var n = cp.spawn(b, [], {
            cwd: item.cwd || process.cwd()
        });
        n.stdin.setEncoding('utf8');
        n.stderr.setEncoding('utf8');
        n.stdout.setEncoding('utf8');
        if (!sumanOpts.no_stream_to_console) {
            n.stdout.pipe(process.stdout, { end: false });
            n.stderr.pipe(process.stderr, { end: false });
        }
        if (!sumanOpts.no_stream_to_file) {
            n.stdout.pipe(strm, { end: false });
            n.stderr.pipe(strm, { end: false });
        }
        n.on('close', function (code) {
            cb(null, {
                code: code,
                name: item.name
            });
        });
    }
    else {
        throw new Error(' => Suman usage error => You do not have the necessary properties on your suman.group item.\n' +
            'Please see xxx.');
    }
};
