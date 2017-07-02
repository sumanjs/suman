'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var os = require('os');
var fs = require('fs');
var colors = require('colors/safe');
var async = require('async');
var su = require('suman-utils');
var mkdirp = require('mkdirp');
var _suman = global.__suman = (global.__suman || {});
module.exports = function createTestFiles(paths) {
    var p = path.resolve(__dirname, '..', 'default-conf-files/suman.skeleton.js');
    var strm = fs.createReadStream(p);
    async.eachLimit(paths, 5, function (p, cb) {
        mkdirp(path.dirname(p), function (err) {
            if (err) {
                return cb(err);
            }
            strm.pipe(fs.createWriteStream(p, { flags: 'wx' }))
                .once('error', cb)
                .once('finish', function () {
                console.log('\n => File was created:', p);
                cb();
            });
        });
    }, function (err) {
        console.log('\n');
        if (err) {
            console.error(colors.red.bold(' => Suman error => ') + colors.red(err.stack || err), '\n');
            process.exit(1);
        }
        else {
            console.log(colors.blue.bold(' => Suman message => successfully created test skeleton(s).'));
            process.exit(0);
        }
    });
};
