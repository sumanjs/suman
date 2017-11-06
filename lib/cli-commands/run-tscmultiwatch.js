"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var tsc_multi_watch_1 = require("tsc-multi-watch");
var _suman = global.__suman = (global.__suman || {});
exports.run = function (opts) {
    var projectRoot = _suman.projectRoot;
    var sumanMultiLock = path.resolve(projectRoot + '/suman.lock');
    fs.writeFile(sumanMultiLock, { flag: 'wx' }, function (err) {
        if (err && !opts.force) {
            _suman.log.error('Could not acquire lock. Perhaps another similar process is already running. Use --force to override.');
            return;
        }
        process.once('exit', function () {
            _suman.log.info('cleaning up sumanMultiLock.');
            try {
                fs.unlinkSync(sumanMultiLock);
            }
            catch (err) {
            }
        });
        var sumanMultiReadyLock = path.resolve(projectRoot + '/suman-watch.lock');
        tsc_multi_watch_1.default({}, function (err) {
            if (err) {
                console.error(err.stack || err);
                return process.exit(1);
            }
            fs.writeFile(sumanMultiReadyLock, { flag: 'wx' }, function (err) {
                if (err) {
                    _suman.log.error(err.stack || err);
                }
                else {
                    _suman.log.info('successful started multi watch process.');
                }
                var cleanUp = function () {
                    console.log('\n');
                    _suman.log.info('cleaning up sumanMultiReadyLock.');
                    try {
                        fs.unlinkSync(sumanMultiReadyLock);
                    }
                    catch (err) {
                    }
                    process.exit(0);
                };
                process.on('SIGINT', cleanUp);
                process.once('exit', cleanUp);
            });
        });
    });
};
