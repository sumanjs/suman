'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var os = require('os');
var path = require('path');
var fs = require('fs');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../../config/suman-constants').constants;
var su = require('suman-utils');
exports.makeAppendToBashProfile = function (pkgDotJSON, projectRoot) {
    return function appendToBashProfile(cb) {
        return process.nextTick(cb);
        var bashProfileFile = path.resolve(su.getHomeDir() + '/.bash_profile');
        var cmd = 'export NODE_PATH=$(npm root -g):$NODE_PATH';
        fs.readFile(bashProfileFile, function (err, contents) {
            if (err) {
                return cb(err);
            }
            if (String(contents).indexOf(cmd) < 0) {
                fs.appendFile(bashProfileFile, '\n\n' + cmd, cb);
            }
            else {
                cb(null);
            }
        });
    };
};
