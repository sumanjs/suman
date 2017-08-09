'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var os = require('os');
var path = require('path');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../../config/suman-constants').constants;
exports.determineIfReadlinkAvail = function (pkgDotJSON, projectRoot) {
    return function whichReadlink(cb) {
        cp.exec('which readlink', function (err, stdout, stderr) {
            if (err || stderr) {
                cb(String((err.stack || err) + '\n' + stderr));
            }
            else if (String(stdout).indexOf(path.sep) > -1) {
                console.log(' => readlink utility is located here => ', chalk.green.bold(stdout));
                cb(null);
            }
            else {
                console.log('\n', chalk.red.bold(' => You will need to install a "readlink" utility on your machine. ' +
                    'See: http://sumanjs.org/readlink.html'), '\n');
                cb(null);
            }
        });
    };
};
