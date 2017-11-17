'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var os = require('os');
var path = require('path');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
exports.determineIfReadlinkAvail = function (pkgDotJSON, projectRoot) {
    return function whichReadlink(cb) {
        cp.exec('which readlink', function (err, stdout, stderr) {
            if (err || stderr) {
                cb({ stack: err && err.stack || err, stderr: stderr || null });
            }
            else if (String(stdout).indexOf('/') > -1) {
                _suman.log.info(' => readlink utility is located here => ', chalk.green.bold(stdout));
                cb(null);
            }
            else {
                var message = ' => You will need to install a "readlink" utility on your machine. See: http://sumanjs.org/readlink.html';
                _suman.log.warning(chalk.red.bold(message));
                cb(null);
            }
        });
    };
};
