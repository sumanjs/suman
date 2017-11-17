'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var os = require('os');
var fs = require('fs');
var chalk = require("chalk");
var async = require("async");
var mkdirp = require('mkdirp');
var _suman = global.__suman = (global.__suman || {});
exports.run = function createTestFiles(paths) {
    var p = path.resolve(__dirname, '..', '..', 'default-conf-files/suman.skeleton.js');
    var strm = fs.createReadStream(p);
    console.log();
    async.eachLimit(paths, 5, function (p, cb) {
        mkdirp(path.dirname(p), function (err) {
            if (err) {
                return cb(err);
            }
            strm.pipe(fs.createWriteStream(p, { flags: 'wx' }))
                .once('error', cb)
                .once('finish', function () {
                _suman.log.good(" => File was created:  \"" + chalk.bold(p) + "\"");
                cb(null);
            });
        });
    }, function (err) {
        console.log();
        if (err) {
            _suman.log.error(chalk.red.bold('There was an error creating at least one suman test skeleton:'));
            _suman.log.error(chalk.red(String(err.stack || err)));
            return process.exit(1);
        }
        _suman.log.verygood(chalk.green.bold(' => Suman message => successfully created test skeleton(s).'));
        process.exit(0);
    });
};
